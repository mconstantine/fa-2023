import { BankEntry } from "./BankEntry"

export enum Category {
  BANK = "bank",
  OCTOPUS = "octopus",
  SERVER = "server",
  PORN = "porn",
  TELEPASS = "telepass",
  GROCERIES = "groceries",
  INVESTMENTS = "investments",
  BIKE = "bike",
  RENT = "rent",
  HAIRDRESSER = "hair dresser",
  CARSHARING = "car sharing",
  INSURANCE = "insurance",
  SUBSCRIPTIONS = "subscriptions",
  TAXES = "taxes",
  GAS = "gas",
  MISC = "miscellanea",
  UNKNOWN = "unknown",
}

export class CategorizedBankEntry extends BankEntry {
  public readonly category: Category

  private constructor(
    date: Date,
    reason: string,
    value: number,
    category: Category,
  ) {
    super(date, reason, value)
    this.category = category
  }

  static fromBankEntry(
    bankEntry: BankEntry,
    category: Category,
  ): CategorizedBankEntry {
    return new CategorizedBankEntry(
      bankEntry.date,
      bankEntry.reason,
      bankEntry.value,
      category,
    )
  }
}
