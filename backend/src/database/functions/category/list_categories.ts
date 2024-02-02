import { PaginationResponse, type PaginationQuery } from "../../Pagination"
import * as db from "../../db"
import { type FunctionTemplate } from "../template"
import { Category } from "./domain"

export default {
  name: "list_categories",
  args: [
    {
      mode: "IN",
      type: "jsonb",
      name: "pagination_query",
      defaultExpr: null,
    },
    {
      mode: "IN",
      type: "character varying",
      name: "search_query",
      defaultExpr: null,
    },
  ],
  returns: "jsonb",
  volatility: "STABLE",
  leakproof: true,
  parallel: "SAFE",
  cost: null,
} satisfies FunctionTemplate

export async function listCategories(
  searchQuery: string,
  paginationQuery: PaginationQuery,
): Promise<PaginationResponse<Category>> {
  return await db.callFunction(
    "list_categories",
    PaginationResponse(Category),
    paginationQuery,
    searchQuery,
  )
}
