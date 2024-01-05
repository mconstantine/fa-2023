import {
  HttpError,
  JsonController,
  Post,
  UploadedFiles,
} from "routing-controllers"
import { Transaction } from "../models/Transaction"
import { Source } from "../adapters/Source"
import { Result } from "../Result"
import { type ImportError } from "../adapters/Adapter"
import { MoreThanOrEqual, LessThanOrEqual, And } from "typeorm"

interface ImportResponse {
  errors: string[]
}

@JsonController("/transactions")
export class TransactionController {
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

    const importResult = Result.merge<ImportError[], typeof results>(results)

    if (importResult.isFailure()) {
      return {
        errors: importResult.error.map(
          (error) => `${error.type}: ${error.subject}`,
        ),
      }
    }

    const result = importResult.unsafeGetValue()
    const mergedTransactions =
      TransactionController.mergeBankAndPayPalTransactions(
        result.bank,
        result.paypal,
      )

    if (mergedTransactions.length > 0) {
      const allDatesTimestamps = mergedTransactions.map((t) => t.date.getTime())
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
