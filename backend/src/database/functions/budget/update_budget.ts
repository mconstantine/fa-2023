import * as S from "@effect/schema/Schema"
import { type FunctionTemplate } from "../template"
import * as db from "../../db"
import { BudgetWithCategory } from "./domain"

export default {
  name: "update_budget",
  args: [
    {
      mode: "IN",
      type: "uuid",
      name: "target_id",
      defaultExpr: null,
    },
    {
      mode: "IN",
      type: "jsonb",
      name: "body",
      defaultExpr: null,
    },
  ],
  returns: "jsonb",
  volatility: "VOLATILE",
  leakproof: false,
  parallel: "UNSAFE",
  cost: null,
} satisfies FunctionTemplate

export const UpdateBudgetInput = S.struct({
  year: S.optional(S.number.pipe(S.int()).pipe(S.positive())),
  value: S.optional(
    S.number.pipe(
      S.transform(
        S.number,
        (n) => parseFloat((n / 100).toFixed(2)),
        (n) => Math.floor(n * 100),
      ),
    ),
  ),
  category_id: S.optional(S.nullable(S.UUID)),
})

export interface UpdateBudgetInput
  extends S.Schema.To<typeof UpdateBudgetInput> {}

export async function updateBudget(
  id: S.Schema.To<typeof S.UUID>,
  body: UpdateBudgetInput,
): Promise<BudgetWithCategory> {
  return await db.callFunction("update_budget", BudgetWithCategory, id, body)
}
