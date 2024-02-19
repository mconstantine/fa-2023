import * as S from "@effect/schema/Schema"
import { PaginationResponse } from "../../globalDomain"
import {
  makeDelete,
  makeGet,
  makePatch,
  makePost,
} from "../../network/HttpRequest"
import {
  InsertTransactionInput,
  ListTransactionsInput,
  Transaction,
  TransactionWithCategories,
  UpdateTransactionInput,
  UpdateTransactionsInput,
} from "./domain"

export const listTransactionsRequest = makeGet("/transactions/", {
  query: ListTransactionsInput,
  response: PaginationResponse(TransactionWithCategories),
})

export const insertTransactionRequest = makePost("/transactions/", {
  body: InsertTransactionInput,
  response: TransactionWithCategories,
})

export const updateTransactionRequest = makePatch("/transactions/:id/", {
  params: S.struct({
    id: S.UUID,
  }),
  body: UpdateTransactionInput,
  response: TransactionWithCategories,
})

export const updateTransactionsRequest = makePatch("/transactions/bulk/", {
  body: UpdateTransactionsInput,
  response: S.array(TransactionWithCategories),
})

export const deleteTransactionRequest = makeDelete("/transactions/:id/", {
  params: S.struct({
    id: S.UUID,
  }),
  response: Transaction,
})
