import { Either, pipe } from "effect"
import { type Transaction } from "../database/functions/transaction/domain"
import { Adapter, ImportError, ImportErrorType } from "./Adapter"
import { Source } from "./Source"
import { dateFromItalianString } from "./dateFromItalianString"

export class BankAdapter extends Adapter {
  public override readonly name = Source.BANK

  public static override fromString(
    input: string,
  ): Either.Either<ImportError, Omit<Transaction, "id">> {
    const [, dateString, description, inbound, outbound] = input.split(";")

    if (
      typeof dateString === "undefined" ||
      typeof inbound === "undefined" ||
      typeof outbound === "undefined" ||
      typeof description === "undefined"
    ) {
      return Either.left(new ImportError(ImportErrorType.INVALID_ROW, input))
    }

    return pipe(
      dateFromItalianString(dateString),
      Either.fromOption(
        () => new ImportError(ImportErrorType.INVALID_DATE, dateString),
      ),
      Either.flatMap((date) => {
        const valueString = inbound !== "" ? inbound : outbound

        if (typeof valueString === "undefined") {
          return Either.left(new ImportError(ImportErrorType.NO_VALUE, input))
        }

        const value = Math.round(
          parseFloat(valueString.replace(".", "").replace(",", ".")) * 100,
        )

        return Either.right({ description, value, date })
      }),
    )
  }
}
