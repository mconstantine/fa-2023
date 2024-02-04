import * as S from "@effect/schema/Schema"
import { PaginationResponse, type PaginationQuery } from "../../Pagination"
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
    max: S.number.pipe(
      S.transform(
        S.number,
        (n) => Math.floor(n * 100),
        (n) => parseFloat((n / 100).toFixed(2)),
      ),
    ),
    min: S.number.pipe(
      S.transform(
        S.number,
        (n) => Math.floor(n * 100),
        (n) => parseFloat((n / 100).toFixed(2)),
      ),
    ),
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

export async function listTransactions(
  paginationQuery: PaginationQuery,
  filters: ListTransactionsFilters,
): Promise<PaginationResponse<TransactionWithCategories>> {
  return await db.callFunction(
    "list_transactions",
    PaginationResponse(TransactionWithCategories),
    paginationQuery,
    filters,
  )
}
