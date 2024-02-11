import * as S from "@effect/schema/Schema"
import {
  InsertTransactionInput,
  ListTransactionsInput as ServerListTransactionsInput,
  TransactionWithCategories as ServerTransactionWithCategories,
  UpdateTransactionsInput as ServerUpdateTransactionsInput,
} from "../../../../backend/src/database/functions/transaction/domain"
import { PaginationResponse } from "../../globalDomain"
import { makeGet, makePatch, makePost } from "../../network/HttpRequest"

export const ListTransactionsInput = ServerListTransactionsInput
export type ListTransactionsInput = ServerListTransactionsInput

export const UpdateTransactionsInput = ServerUpdateTransactionsInput
export type UpdateTransactionsInput = ServerUpdateTransactionsInput

export const TransactionWithCategories = S.extend(
  S.omit<ServerTransactionWithCategories, ["value"]>("value")(
    ServerTransactionWithCategories,
  ),
  S.struct({
    value: S.number,
  }),
)
export interface TransactionWithCategories
  extends S.Schema.To<typeof TransactionWithCategories> {}

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
