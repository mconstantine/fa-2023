import { type Either } from "effect"
import { type Transaction } from "../database/functions/transaction/domain"
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

export abstract class Adapter {
  public readonly name!: Source
  public static fromString: (
    input: string,
  ) => Either.Either<ImportError, Omit<Transaction, "id">>
}
