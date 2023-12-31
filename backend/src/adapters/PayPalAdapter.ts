import { Transaction } from "../models/Transaction"
import { Adapter } from "./Adapter"
import { Source } from "./Source"
import { dateFromItalianString } from "./dateFromItalianString"

export class PayPalAdapter extends Adapter {
  public override readonly name = Source.PAYPAL

  public static override fromString(input: string): Transaction {
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
      throw new EvalError("invalid PayPal transaction: wrong elements count")
    }

    const date = dateFromItalianString(dateString)

    const description = (() => {
      if (email !== "" || receiverName !== "") {
        return `${receiverName}<${email}>: ${transactionDescription}`
      } else {
        return transactionDescription
      }
    })()

    const value = parseInt(valueString)

    return Transaction.create({
      description,
      value,
      date,
    })
  }
}
