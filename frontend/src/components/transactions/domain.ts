import * as S from "@effect/schema/Schema"
import {
  InsertTransactionInput as ServerInsertTransactionInput,
  TransactionWithCategories as ServerTransactionWithCategories,
  UpdateTransactionsInput as ServerUpdateTransactionsInput,
  UpdateTransactionInput as ServerUpdateTransactionInput,
} from "../../../../backend/src/database/functions/transaction/domain"
import { PaginationQuery } from "../../globalDomain"

const ListTransactionsFiltersSubject = S.union(
  S.struct({
    subject: S.literal("description"),
    search_query: S.string,
  }),
  S.struct({
    subject: S.literal("value"),
    max: S.NumberFromString,
    min: S.NumberFromString,
  }),
)

const ListTransactionsFiltersCategories = S.union(
  S.struct({ categories: S.literal("all") }),
  S.struct({ categories: S.literal("uncategorized") }),
  S.struct({
    categories: S.literal("specific"),
    categories_ids: S.nonEmptyArray(S.UUID),
  }),
)

const ListTransactionsFilters = S.extend(
  S.extend(ListTransactionsFiltersSubject, ListTransactionsFiltersCategories),
  S.struct({
    date_since: S.DateFromString,
    date_until: S.DateFromString,
  }),
)

type ListTransactionsFilters = S.Schema.To<typeof ListTransactionsFilters>

export const ListTransactionsInput = S.extend(
  PaginationQuery,
  ListTransactionsFilters,
)

export type ListTransactionsInput = S.Schema.To<typeof ListTransactionsInput>

export const UpdateTransactionsInput = S.extend(
  ServerUpdateTransactionsInput.pipe(S.omit("value")),
  S.struct({
    value: S.optional(S.number),
  }),
)
export type UpdateTransactionsInput = S.Schema.To<
  typeof UpdateTransactionsInput
>

export const UpdateTransactionInput = S.extend(
  ServerUpdateTransactionInput.pipe(S.omit("value")),
  S.struct({
    value: S.optional(S.number),
  }),
)
export type UpdateTransactionInput = S.Schema.To<typeof UpdateTransactionInput>

export const InsertTransactionInput = S.extend(
  ServerInsertTransactionInput.pipe(S.omit("value")),
  S.struct({
    value: S.optional(S.number),
  }),
)
export type InsertTransactionInput = S.Schema.To<typeof InsertTransactionInput>

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
