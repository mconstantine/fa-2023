import { Result } from "../Result"
import { Transaction } from "../models/Transaction"
import { Adapter, ImportError, ImportErrorType } from "./Adapter"
import { Source } from "./Source"
import { dateFromItalianString } from "./dateFromItalianString"

export class BankAdapter extends Adapter {
  public override readonly name = Source.BANK

  public static override fromString(
    input: string,
  ): Result<ImportError, Transaction> {
    const [, dateString, description, inbound, outbound] = input.split(";")

    if (
      typeof dateString === "undefined" ||
      typeof inbound === "undefined" ||
      typeof outbound === "undefined" ||
      typeof description === "undefined"
    ) {
      return Result.fromFailure(
        new ImportError(ImportErrorType.INVALID_ROW, input),
      )
    }

    const dateResult = dateFromItalianString(dateString)

    return dateResult.match<Result<ImportError, Transaction>>(
      () =>
        Result.fromFailure(
          new ImportError(ImportErrorType.INVALID_DATE, dateString),
        ),
      (date) => {
        const valueString = inbound !== "" ? inbound : outbound

        if (typeof valueString === "undefined") {
          return Result.fromFailure(
            new ImportError(ImportErrorType.NO_VALUE, input),
          )
        }

        const value = parseFloat(valueString.replace(",", "."))

        return Result.fromSuccess(
          Transaction.create({
            description,
            value,
            date,
          }),
        )
      },
    )
  }
}
