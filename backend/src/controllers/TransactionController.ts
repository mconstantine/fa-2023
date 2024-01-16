import {
  Body,
  Get,
  HttpError,
  JsonController,
  Patch,
  Post,
  QueryParams,
  UploadedFiles,
} from "routing-controllers"
import { Transaction } from "../models/Transaction"
import { Source } from "../adapters/Source"
import { result } from "../Result"
import { type ImportError } from "../adapters/Adapter"
import { MoreThanOrEqual, LessThanOrEqual, And, In } from "typeorm"
import {
  ArrayMinSize,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from "class-validator"
import { AppDataSource } from "../AppDataSource"

interface ImportResponse {
  errors: string[]
}

enum FindTransactionsCategoryMode {
  ALL = "all",
  UNCATEGORIZED = "uncategorized",
  SPECIFIC = "specific",
}

class FindQueryParams {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  public query?: string

  @IsOptional()
  @IsDateString()
  public startDate?: string

  @IsOptional()
  @IsDateString()
  public endDate?: string

  @IsEnum(FindTransactionsCategoryMode)
  public categoryMode!: FindTransactionsCategoryMode

  @ValidateIf(
    (data: FindQueryParams) =>
      data.categoryMode === FindTransactionsCategoryMode.SPECIFIC,
    {
      each: true,
    },
  )
  @ArrayMinSize(1)
  public categories!: string[]
}

export enum CategoryUpdateMode {
  REPLACE = "replace",
  ADD = "add",
}

class BulkUpdateTransactionsBody {
  @IsUUID("4", { each: true })
  public ids!: string[]

  @IsOptional()
  @IsNotEmpty()
  description?: string

  @IsOptional()
  @IsUUID(4, { each: true })
  public categoryIds?: string[]

  @IsEnum(CategoryUpdateMode)
  public categoryUpdateMode!: CategoryUpdateMode
}

@JsonController("/transactions")
export class TransactionController {
  @Get("/")
  public async find(
    @QueryParams() params: FindQueryParams,
  ): Promise<[Transaction[], number]> {
    console.log("TODO:", { params })

    const searchQuery = params.query?.toLowerCase() ?? ""

    const startTimeCondition =
      typeof params.startDate !== "undefined"
        ? MoreThanOrEqual(new Date(params.startDate))
        : null

    const endTimeCondition =
      typeof params.endDate !== "undefined"
        ? LessThanOrEqual(new Date(params.endDate))
        : null

    const timeCondition = (() => {
      if (startTimeCondition !== null && endTimeCondition !== null) {
        return And(startTimeCondition, endTimeCondition)
      } else if (startTimeCondition !== null) {
        return startTimeCondition
      } else if (endTimeCondition !== null) {
        return endTimeCondition
      } else {
        return null
      }
    })()

    const query = Transaction.createQueryBuilder("t")
      .leftJoinAndSelect("t.categories", "categories")
      .where("1 = 1")
      .orderBy({
        date: "DESC",
      })

    if (searchQuery !== "") {
      query.andWhere("LOWER(t.description) LIKE :searchQuery", {
        searchQuery: `%${searchQuery}%`,
      })
    }

    if (timeCondition !== null) {
      query.andWhere({ date: timeCondition })
    }

    return await query.getManyAndCount()
  }

  @Post("/import")
  public async import(
    @UploadedFiles("files", { required: true }) files: Express.Multer.File[],
  ): Promise<ImportResponse> {
    const bankFile = files.find(
      (file) => file.originalname.toLowerCase() === "bank.csv",
    )

    const paypalFile = files.find(
      (file) => file.originalname.toLowerCase() === "paypal.csv",
    )

    if (typeof bankFile === "undefined" || typeof paypalFile === "undefined") {
      throw new HttpError(
        422,
        "The files should be named bank.csv and paypal.csv",
      )
    }

    const bankFileContent = (() => {
      try {
        return bankFile.buffer.toString("utf8")
      } catch (e) {
        throw new HttpError(
          400,
          "The file bank.csv is not properly encoded to UTF-8",
        )
      }
    })()

    const paypalFileContent = (() => {
      try {
        return paypalFile.buffer.toString("utf-8")
      } catch (e) {
        throw new HttpError(
          400,
          "The file paypal.csv is not properly encoded to UTF-8",
        )
      }
    })()

    const results = {
      bank: Transaction.importFile(bankFileContent, Source.BANK),
      paypal: Transaction.importFile(paypalFileContent, Source.PAYPAL),
    }

    const importResult = result.merge<ImportError[], typeof results>(results)

    if (importResult.isFailure()) {
      return {
        errors: importResult.error.map(
          (error) => `${error.type}: ${error.subject}`,
        ),
      }
    } else {
      const mergedTransactions =
        TransactionController.mergeBankAndPayPalTransactions(
          importResult.value.bank,
          importResult.value.paypal,
        )

      if (mergedTransactions.length > 0) {
        const allDatesTimestamps = mergedTransactions.map((t) =>
          t.date.getTime(),
        )

        const minDateTimestamp = Math.min(...allDatesTimestamps)
        const maxDateTimestamp = Math.max(...allDatesTimestamps)

        const minDateSqlString = new Date(minDateTimestamp)
          .toISOString()
          .slice(0, 10)

        const maxDateSqlString = new Date(maxDateTimestamp)
          .toISOString()
          .slice(0, 10)

        await Transaction.createQueryBuilder()
          .delete()
          .where({
            date: And(
              MoreThanOrEqual(minDateSqlString),
              LessThanOrEqual(maxDateSqlString),
            ),
          })
          .execute()
      }

      await Transaction.insert(mergedTransactions)
      return { errors: [] }
    }
  }

  @Patch()
  public async bulkUpdate(
    @Body() body: BulkUpdateTransactionsBody,
  ): Promise<Transaction[]> {
    if (typeof body.description !== "undefined") {
      await Transaction.createQueryBuilder()
        .where({ id: In(body.ids) })
        .update({
          description: body.description,
        })
        .execute()
    }

    if (typeof body.categoryIds !== "undefined") {
      if (body.categoryUpdateMode === CategoryUpdateMode.REPLACE) {
        await AppDataSource.createQueryBuilder()
          .from("transaction_categories_category", "tc")
          .delete()
          .where({ transactionId: In(body.ids) })
          .execute()
      }

      await AppDataSource.createQueryBuilder()
        .from("transaction_categories_category", "tc")
        .insert()
        .values(
          body.ids.flatMap((transactionId) =>
            // we just checked that categoryIds is defined
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            body.categoryIds!.map((categoryId) => ({
              transactionId,
              categoryId,
            })),
          ),
        )
        .execute()
    }

    return await Transaction.createQueryBuilder("t")
      .leftJoinAndSelect("t.categories", "categories")
      .where({ id: In(body.ids) })
      .getMany()
  }

  public static mergeBankAndPayPalTransactions(
    bankTransactions: Transaction[],
    paypalTransactions: Transaction[],
  ): Transaction[] {
    const mutBankTransactions = bankTransactions.toSorted(
      (a, b) => a.date.getTime() - b.date.getTime(),
    )

    const mutPayPalTransactions = paypalTransactions.toSorted(
      (a, b) => b.date.getTime() - a.date.getTime(),
    )

    for (const [index, bankTransaction] of mutBankTransactions.entries()) {
      if (bankTransaction.description.includes("PayPal")) {
        const paypalTransactionIndex = mutPayPalTransactions.findIndex(
          (paypalTransaction) =>
            paypalTransaction.date.getTime() <=
              bankTransaction.date.getTime() &&
            paypalTransaction.value === bankTransaction.value,
        )

        if (paypalTransactionIndex >= 0) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          mutBankTransactions[index]!.description =
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            mutPayPalTransactions[paypalTransactionIndex]!.description

          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          mutBankTransactions[index]!.date =
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            mutPayPalTransactions[paypalTransactionIndex]!.date

          mutPayPalTransactions.splice(paypalTransactionIndex, 1)
        }
      }
    }

    return mutBankTransactions
  }
}
