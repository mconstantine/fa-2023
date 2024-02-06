import { type FunctionTemplate } from "../template"
import * as S from "@effect/schema/Schema"
import * as db from "../../db"
import { Category } from "./domain"

export default {
  name: "update_category",
  args: [
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

export const UpdateCategoryInput = S.struct({
  name: S.optional(S.string.pipe(S.nonEmpty())),
  is_meta: S.optional(S.boolean),
  keywords: S.optional(S.array(S.string.pipe(S.nonEmpty()))),
})

export interface UpdateCategoryInput
  extends S.Schema.To<typeof UpdateCategoryInput> {}

export async function updateCategory(
  id: S.Schema.To<typeof S.UUID>,
  body: UpdateCategoryInput,
): Promise<Category> {
  return await db.callFunction("update_category", Category, id, body)
}
