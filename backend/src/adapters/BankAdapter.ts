import { Transaction } from "../models/Transaction"
import { Adapter } from "./Adapter"

export class BankAdapter extends Adapter {
  public override readonly name = "bank"

  public static override fromString(input: string): Transaction {
    const [, dateString, description, inbound, outbound] = input.split(";")

    if (typeof dateString === "undefined") {
      throw new EvalError(
        "malformed bank transaction: invalid count of raw elements",
      )
    }

    const [dayString, monthPlusOneString, yearString] = dateString.split("/")

    if (
      typeof dayString === "undefined" ||
      typeof monthPlusOneString === "undefined" ||
      typeof yearString === "undefined"
    ) {
      throw new EvalError(
        "malformed bank transaction: invalid value date field",
      )
    }

    const date = new Date(
      parseInt(yearString),
      parseInt(monthPlusOneString) - 1,
      parseInt(dayString),
    )

    const valueString =
      typeof inbound !== "undefined" && inbound !== "" ? inbound : outbound

    if (typeof valueString === "undefined") {
      throw new EvalError(
        "malformed bank transaction: no value, either inbound or outbound",
      )
    }

    const value = parseFloat(valueString)

    if (typeof description === "undefined") {
      throw new EvalError("malformed bank transaction: no description")
    }

    return Transaction.create({
      description,
      value,
      date,
    })
  }
}
