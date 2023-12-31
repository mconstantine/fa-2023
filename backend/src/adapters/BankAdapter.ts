import { Transaction } from "../models/Transaction"
import { Adapter } from "./Adapter"
import { Source } from "./Source"
import { dateFromItalianString } from "./dateFromItalianString"

export enum BankAdapterErrorType {
  INVALID_ROW,
  INVALID_DATE,
  NO_VALUE,
}

export class BankAdapterError extends Error {
  public readonly type: BankAdapterErrorType

  constructor(type: BankAdapterErrorType) {
    super("invalid bank transaction format")
    this.type = type
  }
}

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
      throw new BankAdapterError(BankAdapterErrorType.INVALID_ROW)
    }

    const date = (() => {
      try {
        return dateFromItalianString(dateString)
      } catch (e) {
        throw new BankAdapterError(BankAdapterErrorType.INVALID_DATE)
      }
    })()

    const valueString = inbound !== "" ? inbound : outbound

    if (typeof valueString === "undefined") {
      throw new BankAdapterError(BankAdapterErrorType.NO_VALUE)
    }

    const value = parseFloat(valueString)

    return Transaction.create({
      description,
      value,
      date,
    })
  }
}
