import { type Result } from "../Result"
import { type Transaction } from "../models/Transaction"
import { type Source } from "./Source"

export enum ImportErrorType {
  INVALID_ROW = "InvalidRow",
  INVALID_DATE = "InvalidDate",
  NO_VALUE = "NoValue",
}

export class ImportError extends Error {
  public readonly type: ImportErrorType
  public readonly subject: string

  constructor(type: ImportErrorType, subject: string) {
    super(subject)
    this.type = type
    this.subject = subject
  }
}

/*
TODO:
[x] Adapter.fromString should return some kind of result
[ ] If there are no errors, transactions should be saved to DB
[ ] Previously saved transactions with the same dates should be deleted before saving
[ ] PayPal mock data should only have stuff from December, but how do bank refunds work?
*/
export abstract class Adapter {
  public readonly name!: Source
  public static fromString: (input: string) => Result<ImportError, Transaction>
}
