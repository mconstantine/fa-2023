import { PaginationResponse } from "../../domain"
import * as db from "../../db"
import { type FunctionTemplate } from "../template"
import { Category, type ListCategoriesInput } from "./domain"

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
    {
      mode: "IN",
      type: "boolean",
      name: "is_meta_filter",
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
  input: ListCategoriesInput,
): Promise<PaginationResponse<Category>> {
  const {
    search_query: searchQuery,
    is_meta: isMeta,
    ...paginationQuery
  } = input

  return await db.callFunction(
    "list_categories",
    PaginationResponse(Category),
    paginationQuery,
    searchQuery ?? "",
    isMeta ?? null,
  )
}
