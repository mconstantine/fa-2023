import { Transaction } from "../models/Transaction"
import { Adapter, Source } from "./Adapter"
import { dateFromItalianString } from "./dateFromItalianString"

export class BankAdapter extends Adapter {
  public override readonly name = Source.BANK

  public static override fromString(input: string): Transaction {
    const [, dateString, description, inbound, outbound] = input.split(";")

    if (
      typeof dateString === "undefined" ||
      typeof inbound === "undefined" ||
      typeof outbound === "undefined" ||
      typeof description === "undefined"
    ) {
      throw new EvalError(
        "malformed bank transaction: invalid count of raw elements",
      )
    }

    const date = dateFromItalianString(dateString)
    const valueString = inbound !== "" ? inbound : outbound

    if (typeof valueString === "undefined") {
      throw new EvalError(
        "malformed bank transaction: no value, either inbound or outbound",
      )
    }

    const value = parseFloat(valueString)

    return Transaction.create({
      description,
      value,
      date,
    })
  }
}
