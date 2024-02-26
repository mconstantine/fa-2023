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
    search_query: S.string,
  }),
  S.struct({
    subject: S.literal("value"),
    max: S.compose(S.NumberFromString, ValueFromCurrency),
    min: S.compose(S.NumberFromString, ValueFromCurrency),
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
  categories_ids: S.array(S.UUID),
})

export interface InsertTransactionInput
  extends S.Schema.To<typeof InsertTransactionInput> {}

export const UpdateTransactionInput = S.struct({
  description: S.optional(S.string.pipe(S.nonEmpty())),
  value: S.optional(ValueFromCurrency),
  date: S.optional(S.DateFromString),
  categories_ids: S.optional(S.array(S.UUID)),
})

export interface UpdateTransactionInput
  extends S.Schema.To<typeof UpdateTransactionInput> {}

const UpdateTransactionsInputNoCategories = S.struct({
  ids: S.array(S.UUID),
  description: S.optional(S.string.pipe(S.nonEmpty())),
  value: S.optional(ValueFromCurrency),
  date: S.optional(S.DateFromString),
})

const UpdateTransactionsInputCategories = S.extend(
  UpdateTransactionsInputNoCategories,
  S.struct({
    categories_mode: S.literal("add", "replace"),
    categories_ids: S.array(S.UUID),
  }),
)

export const UpdateTransactionsInput = S.union(
  UpdateTransactionsInputNoCategories,
  UpdateTransactionsInputCategories,
)

export type UpdateTransactionsInput = S.Schema.To<
  typeof UpdateTransactionsInput
>

export const AggregateTransactionsByCategoryInput = S.struct({
  year: S.NumberFromString.pipe(S.int()).pipe(S.positive()),
})

export type AggregateTransactionsByCategoryInput = S.Schema.To<
  typeof AggregateTransactionsByCategoryInput
>

export const TransactionByCategory = S.struct({
  category_id: S.nullable(S.UUID),
  category_name: S.nullable(S.Trim.pipe(S.nonEmpty())),
  transactions_total: CurrencyFromValue,
})

export type TransactionByCategory = S.Schema.To<typeof TransactionByCategory>

export const AggregateTransactionsByMonthInput = S.struct({
  year: S.NumberFromString.pipe(S.int()).pipe(S.positive()),
})

export type AggregateTransactionsByMonthInput = S.Schema.To<
  typeof AggregateTransactionsByMonthInput
>

export const TransactionByMonth = S.struct({
  month: S.number.pipe(S.greaterThanOrEqualTo(1)).pipe(S.lessThanOrEqualTo(12)),
  income: CurrencyFromValue,
  outcome: CurrencyFromValue,
  total: CurrencyFromValue,
})

export type TransactionByMonth = S.Schema.To<typeof TransactionByMonth>

export const AggregateTransactionsByTimeAndCategoryInput = S.struct({
  time_range: S.literal("monthly", "weekly", "daily"),
  year: S.NumberFromString.pipe(S.int()).pipe(S.positive()),
  categories_ids: S.optional(S.array(S.UUID)),
})

export type AggregateTransactionsByTimeAndCategoryInput = S.Schema.To<
  typeof AggregateTransactionsByTimeAndCategoryInput
>

export const TransactionsByTimeAndCategory = S.struct({
  time: S.array(
    S.struct({
      time: S.number,
      total: CurrencyFromValue,
    }),
  ),
  categories: S.array(
    S.struct({
      id: S.UUID,
      name: S.string.pipe(S.nonEmpty()),
      is_meta: S.boolean,
      max_transaction_value: CurrencyFromValue,
      min_transaction_value: CurrencyFromValue,
      total: CurrencyFromValue,
    }),
  ),
})

export type TransactionsByTimeAndCategory = S.Schema.To<
  typeof TransactionsByTimeAndCategory
>
