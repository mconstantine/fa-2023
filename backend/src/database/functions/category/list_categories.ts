import * as S from "@effect/schema/Schema"
import { PaginationResponse, PaginationQuery } from "../../domain"
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

export const ListCategoriesInput = S.extend(
  PaginationQuery,
  S.struct({
    search_query: S.optional(S.string),
  }),
)

export interface ListCategoriesInput
  extends S.Schema.To<typeof ListCategoriesInput> {}

export async function listCategories(
  input: ListCategoriesInput,
): Promise<PaginationResponse<Category>> {
  const { search_query: searchQuery, ...paginationQuery } = input

  return await db.callFunction(
    "list_categories",
    PaginationResponse(Category),
    paginationQuery,
    searchQuery ?? "",
  )
}
