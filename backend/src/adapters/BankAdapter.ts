import { type Result, result } from "../Result"
import { type Transaction } from "../database/functions/transaction/domain"
import { Adapter, ImportError, ImportErrorType } from "./Adapter"
import { Source } from "./Source"
import { dateFromItalianString } from "./dateFromItalianString"

export class BankAdapter extends Adapter {
  public override readonly name = Source.BANK

  public static override fromString(
    input: string,
  ): Result<ImportError, Omit<Transaction, "id">> {
    const [, dateString, description, inbound, outbound] = input.split(";")

    if (
      typeof dateString === "undefined" ||
      typeof inbound === "undefined" ||
      typeof outbound === "undefined" ||
      typeof description === "undefined"
    ) {
      return result.fromFailure(
        new ImportError(ImportErrorType.INVALID_ROW, input),
      )
    }

    const dateResult = dateFromItalianString(dateString)

    if (dateResult.isFailure()) {
      return result.fromFailure(
        new ImportError(ImportErrorType.INVALID_DATE, dateString),
      )
    } else {
      const date = dateResult.value
      const valueString = inbound !== "" ? inbound : outbound

      if (typeof valueString === "undefined") {
        return result.fromFailure(
          new ImportError(ImportErrorType.NO_VALUE, input),
        )
      }

      const value = parseFloat(valueString.replace(".", "").replace(",", "."))

      return result.fromSuccess({ description, value, date })
    }
  }
}
