import { type Transaction } from "../models/Transaction"

export enum Source {
  BANK = "bank",
  PAYPAL = "paypal",
}

export abstract class Adapter {
  public readonly name!: Source
  public static fromString: (input: string) => Transaction
}
