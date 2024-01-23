import {
  Body,
  Delete,
  Get,
  HttpError,
  JsonController,
  Patch,
  Post,
  QueryParam,
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
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
} from "class-validator"
import { AppDataSource } from "../AppDataSource"

class TransactionCreationBody {
  @IsNotEmpty()
  public description!: string

  @IsNumber()
  public value!: number

  @IsDateString()
  public date!: Date

  @IsUUID(4, { each: true })
  public categoryIds!: string[]
}

interface ImportResponse {
  errors: string[]
}

enum FindTransactionsCategoryMode {
  ALL = "all",
  UNCATEGORIZED = "uncategorized",
  SPECIFIC = "specific",
}

enum FindTransactionsBy {
  DESCRIPTION = "description",
  VALUE = "value",
}

class FindQueryParams {
  @Min(0)
  public page!: number

  @Min(1)
  public perPage!: number

  @IsOptional()
  @IsEnum(FindTransactionsBy)
  public findBy: FindTransactionsBy = FindTransactionsBy.DESCRIPTION

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @ValidateIf(
    (params: FindQueryParams) =>
      params.findBy === FindTransactionsBy.DESCRIPTION,
  )
  public query?: string

  @IsNumber()
  @ValidateIf(
    (params: FindQueryParams) => params.findBy === FindTransactionsBy.VALUE,
  )
  public min!: number

  @IsNumber()
  @ValidateIf(
    (params: FindQueryParams) => params.findBy === FindTransactionsBy.VALUE,
  )
  public max!: number

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

class TransactionUpdateBody extends TransactionCreationBody {
  @IsUUID()
  public id!: string
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

interface CategoriesAggregationQueryResult {
  categoryId: string
  categoryName: string
  transactionsTotal: string
}

interface CategoriesAggregation {
  categoryId: string
  categoryName: string
  transactionsTotal: number
}

@JsonController("/transactions")
export class TransactionController {
  @Post()
  public async create(
    @Body() body: TransactionCreationBody,
  ): Promise<Transaction> {
    return await Transaction.create({
      ...body,
      categories: body.categoryIds.map((id) => ({ id })),
    }).save()
  }

  @Get("/")
  public async find(
    @QueryParams() params: FindQueryParams,
  ): Promise<[Transaction[], number]> {
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

    const query = Transaction.createQueryBuilder("transaction")
      .leftJoinAndSelect("transaction.categories", "categories")
      .where("1 = 1")
      .take(params.perPage)
      .skip(params.perPage * params.page)
      .orderBy({ "transaction.date": "DESC" })

    switch (params.findBy) {
      case FindTransactionsBy.DESCRIPTION: {
        const searchQuery = params.query?.toLowerCase() ?? ""

        if (searchQuery !== "") {
          query.andWhere("LOWER(transaction.description) LIKE :searchQuery", {
            searchQuery: `%${searchQuery}%`,
          })
        }

        if (timeCondition !== null) {
          query.andWhere({ date: timeCondition })
        }

        break
      }
      case FindTransactionsBy.VALUE: {
        query
          .andWhere("transaction.value >= ROUND(:min * 100)", {
            min: params.min,
          })
          .andWhere("transaction.value <= ROUND(:max * 100)", {
            max: params.max,
          })
        break
      }
    }

    switch (params.categoryMode) {
      case FindTransactionsCategoryMode.ALL:
        break
      case FindTransactionsCategoryMode.UNCATEGORIZED:
        query.andWhere("transaction_categories.categoryId IS NULL")
        break
      case FindTransactionsCategoryMode.SPECIFIC:
        query.andWhere(
          "transaction_categories.categoryId IN (:...categories)",
          {
            categories: params.categories,
          },
        )
        break
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
  public async update(
    @Body() body: TransactionUpdateBody,
  ): Promise<Transaction> {
    const transaction = await Transaction.findOneByOrFail({ id: body.id })

    return await Transaction.merge(transaction, {
      ...body,
      categories: body.categoryIds.map((id) => ({ id })),
    }).save()
  }

  @Delete()
  public async delete(
    @Body() body: TransactionUpdateBody,
  ): Promise<Transaction> {
    const transaction = await Transaction.findOneByOrFail({ id: body.id })
    return await transaction.remove()
  }

  @Patch("/bulk")
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

  @Get("/categories")
  public async getCategoriesAggregation(
    @QueryParam("year", { required: true }) year: number,
  ): Promise<CategoriesAggregation[]> {
    const result: CategoriesAggregationQueryResult[] =
      await Transaction.createQueryBuilder("t")
        .leftJoin("t.categories", "c")
        .groupBy("c.id")
        .select("c.id", "categoryId")
        .addSelect("c.name", "categoryName")
        .addSelect(
          "ROUND(SUM(t.value)::NUMERIC(10, 2) / 100, 2)",
          "transactionsTotal",
        )
        .where('EXTRACT("YEAR" FROM t.date) = :year', { year })
        .andWhere("c.isMeta IS FALSE OR c.isMeta IS NULL")
        .orderBy("c.name")
        .execute()

    return result.map((entry) => ({
      ...entry,
      transactionsTotal: parseFloat(entry.transactionsTotal),
    }))
  }
}
