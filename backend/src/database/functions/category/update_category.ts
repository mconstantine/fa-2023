import { type FunctionTemplate } from "../template"
import type * as S from "@effect/schema/Schema"
import * as db from "../../db"
import { Category, type UpdateCategoryInput } from "./domain"
import { type User } from "../user/domain"

export default {
  name: "update_category",
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
    {
      mode: "IN",
      name: "body",
      type: "jsonb",
      defaultExpr: null,
    },
  ],
  returns: "jsonb",
  volatility: "VOLATILE",
  leakproof: false,
  parallel: "UNSAFE",
  cost: null,
} satisfies FunctionTemplate

export async function updateCategory(
  user: User,
  id: S.Schema.To<typeof S.UUID>,
  body: UpdateCategoryInput,
): Promise<Category> {
  return await db.callFunction("update_category", Category, user.id, id, body)
}
