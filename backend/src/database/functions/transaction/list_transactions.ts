import * as S from "@effect/schema/Schema"
import {
  PaginationResponse,
  PaginationQuery,
  CurrencyFromValue,
} from "../../domain"
import * as db from "../../db"
import { type FunctionTemplate } from "../template"
import { TransactionWithCategories } from "./domain"

export default {
  name: "list_transactions",
  args: [
    {
      mode: "IN",
      type: "jsonb",
      name: "pagination_query",
      defaultExpr: null,
    },
    {
      mode: "IN",
      type: "jsonb",
      name: "filters",
      defaultExpr: null,
    },
  ],
  returns: "jsonb",
  volatility: "STABLE",
  leakproof: true,
  parallel: "SAFE",
  cost: null,
} satisfies FunctionTemplate

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

export async function listTransactions(
  input: ListTransactionsInput,
): Promise<PaginationResponse<TransactionWithCategories>> {
  const { direction, count, target, ...filters } = input
  const paginationQuery = { direction, count, target }

  return await db.callFunction(
    "list_transactions",
    PaginationResponse(TransactionWithCategories),
    paginationQuery,
    filters,
  )
}
