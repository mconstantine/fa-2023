import * as S from "@effect/schema/Schema"
import { Category } from "../category/domain"
import {
  CurrencyFromValue,
  PaginationQuery,
  ValueFromCurrency,
} from "../../domain"

export const Transaction = S.struct({
  id: S.UUID,
  description: S.string.pipe(S.nonEmpty()),
  value: CurrencyFromValue,
  date: S.Date,
})

export interface Transaction extends S.Schema.To<typeof Transaction> {}

export const TransactionWithCategories = S.extend(
  Transaction,
  S.struct({
    categories: S.array(Category),
  }),
)

export type TransactionWithCategories = S.Schema.To<
  typeof TransactionWithCategories
>

const ListTransactionsFiltersSubject = S.union(
  S.struct({
    subject: S.literal("description"),
    search_query: S.string.pipe(S.nonEmpty()),
  }),
  S.struct({
    subject: S.literal("value"),
    max: S.compose(S.NumberFromString, CurrencyFromValue),
    min: S.compose(S.NumberFromString, CurrencyFromValue),
  }),
  S.struct({
    subject: S.literal("none"),
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

export const InsertTransactionInput = S.struct({
  description: S.string.pipe(S.nonEmpty()),
  value: ValueFromCurrency,
  date: S.DateFromString,
  categoriesIds: S.array(S.UUID),
})

export interface InsertTransactionInput
  extends S.Schema.To<typeof InsertTransactionInput> {}

export const UpdateTransactionInput = S.struct({
  description: S.optional(S.string.pipe(S.nonEmpty())),
  value: S.optional(ValueFromCurrency),
  date: S.optional(S.DateFromString),
  categoriesIds: S.optional(S.array(S.UUID)),
})

export interface UpdateTransactionInput
  extends S.Schema.To<typeof UpdateTransactionInput> {}

export const UpdateTransactionsInput = S.extend(
  UpdateTransactionInput,
  S.struct({
    ids: S.array(S.UUID),
  }),
)

export interface UpdateTransactionsInput
  extends S.Schema.To<typeof UpdateTransactionsInput> {}
