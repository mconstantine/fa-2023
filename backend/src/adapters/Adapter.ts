import { type Transaction } from "../models/Transaction"
import { type Source } from "./Source"

/*
TODO:
[ ] Adapter.fromString should return some kind of result
[ ] If there are no errors, transactions should be saved to DB
[ ] Previously saved transactions with the same dates should be deleted before saving
[ ] PayPal mock data should only have stuff from December, but how do bank refunds work?
*/
export abstract class Adapter {
  public readonly name!: Source
  public static fromString: (input: string) => Transaction
}
