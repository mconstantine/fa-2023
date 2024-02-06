import * as S from "@effect/schema/Schema"
import { type FunctionTemplate } from "../template"
import { BudgetWithCategory } from "./domain"
import * as db from "../../db"
import { ValueFromCurrency } from "../../domain"

export default {
  name: "update_budgets",
  args: [
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

export const UpdateBudgetsInput = S.array(
  S.struct({
    id: S.UUID,
    value: S.optional(ValueFromCurrency),
  }),
)

export interface UpdateBudgetsInput
  extends S.Schema.To<typeof UpdateBudgetsInput> {}

export async function updateBudgets(
  input: UpdateBudgetsInput,
): Promise<readonly BudgetWithCategory[]> {
  return await db.callFunction(
    "update_budgets",
    S.array(BudgetWithCategory),
    input,
  )
}
