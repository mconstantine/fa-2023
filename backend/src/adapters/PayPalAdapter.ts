import { Result } from "../Result"
import { Transaction } from "../models/Transaction"
import { Adapter, ImportError, ImportErrorType } from "./Adapter"
import { Source } from "./Source"
import { dateFromItalianString } from "./dateFromItalianString"

export class PayPalAdapter extends Adapter {
  public override readonly name = Source.PAYPAL

  public static override fromString(
    input: string,
  ): Result<ImportError, Transaction> {
    const [
      dateString,
      ,
      ,
      transactionDescription,
      ,
      ,
      ,
      valueString,
      ,
      ,
      email,
      receiverName,
    ] = input.split(";")

    if (
      typeof dateString === "undefined" ||
      typeof transactionDescription === "undefined" ||
      typeof valueString === "undefined" ||
      typeof email === "undefined" ||
      typeof receiverName === "undefined"
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
        const description = (() => {
          if (email !== "" || receiverName !== "") {
            return `${receiverName}<${email}>: ${transactionDescription}`
          } else {
            return transactionDescription
          }
        })()

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
