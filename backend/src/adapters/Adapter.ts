import { type Transaction } from "../models/Transaction"

export abstract class Adapter {
  public readonly name!: string
  public static fromString: (input: string) => Transaction
}
