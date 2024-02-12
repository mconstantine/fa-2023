import * as S from "@effect/schema/Schema"
import {
  InsertTransactionInput,
  UpdateTransactionsInput,
} from "../../../../backend/src/database/functions/transaction/domain"
import { PaginationResponse } from "../../globalDomain"
import { makeGet, makePatch, makePost } from "../../network/HttpRequest"
import { ListTransactionsInput, TransactionWithCategories } from "./domain"

export const listTransactionsRequest = makeGet("/transactions/", {
  query: ListTransactionsInput,
  response: PaginationResponse(TransactionWithCategories),
})

export const insertTransactionRequest = makePost("/transactions/", {
  body: InsertTransactionInput,
  response: TransactionWithCategories,
})

export const updateTransactionsRequest = makePatch("/transactions/bulk/", {
  body: UpdateTransactionsInput,
  response: S.array(TransactionWithCategories),
})
