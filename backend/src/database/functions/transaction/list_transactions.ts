import * as S from "@effect/schema/Schema"
import { PaginationResponse, type PaginationQuery } from "../../Pagination"
import * as db from "../../db"
import { type FunctionTemplate } from "../template"
import { Transaction } from "./domain"

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
    searchQuery: S.string.pipe(S.nonEmpty()),
  }),
  S.struct({
    subject: S.literal("value"),
    max: S.number,
    min: S.number,
  }),
  S.struct({
    subject: S.literal("none"),
  }),
)

const ListTransactionsFilterCategories = S.union(
  S.struct({ categories: S.literal("all") }),
  S.struct({ categories: S.literal("uncategorized") }),
  S.struct({
    categories: S.literal("specific"),
    categoriesIds: S.nonEmptyArray(S.UUID),
  }),
)

const ListTransactionsFilters = S.extend(
  S.extend(ListTransactionsFiltersSubject, ListTransactionsFilterCategories),
  S.struct({
    dateSince: S.DateFromString,
    dateUntil: S.DateFromString,
  }),
)

type ListTransactionsFilters = S.Schema.To<typeof ListTransactionsFilters>

export async function listTransactions(
  paginationQuery: PaginationQuery,
  filters: ListTransactionsFilters,
): Promise<PaginationResponse<Transaction>> {
  return await db.callFunction(
    "list_transactions",
    PaginationResponse(Transaction),
    paginationQuery,
    filters,
  )
}
