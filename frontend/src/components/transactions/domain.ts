import * as S from "@effect/schema/Schema"
import {
  TransactionWithCategories as ServerTransactionWithCategories,
  UpdateTransactionsInput as ServerUpdateTransactionsInput,
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
