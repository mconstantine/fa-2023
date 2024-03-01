import type * as S from "@effect/schema/Schema"
import * as db from "../../db"
import { type FunctionTemplate } from "../template"
import { Category } from "./domain"

export default {
  name: "delete_category",
  args: [
    {
      mode: "IN",
      type: "uuid",
      name: "target_id",
      defaultExpr: null,
    },
  ],
  returns: "jsonb",
  volatility: "VOLATILE",
  leakproof: false,
  parallel: "UNSAFE",
  cost: null,
} satisfies FunctionTemplate

export async function deleteCategory(
  id: S.Schema.To<typeof S.UUID>,
): Promise<Category> {
  return await db.callFunction("delete_category", Category, id)
}
