import type * as S from "@effect/schema/Schema"
import * as db from "../../db"
import { type FunctionTemplate } from "../template"
import { Category } from "./domain"
import { type User } from "../user/domain"

export default {
  name: "delete_category",
  args: [
    {
      mode: "IN",
      type: "uuid",
      name: "owner_id",
      defaultExpr: null,
    },
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
  user: User,
  id: S.Schema.To<typeof S.UUID>,
): Promise<Category> {
  return await db.callFunction("delete_category", Category, user.id, id)
}
