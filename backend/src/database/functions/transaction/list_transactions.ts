import { PaginationResponse } from "../../domain"
import * as db from "../../db"
import { type FunctionTemplate } from "../template"
import { type ListTransactionsInput, TransactionWithCategories } from "./domain"

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
