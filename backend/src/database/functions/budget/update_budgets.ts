import * as S from "@effect/schema/Schema"
import { type FunctionTemplate } from "../template"
import { BudgetWithCategory, type UpdateBudgetsInput } from "./domain"
import * as db from "../../db"

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

export async function updateBudgets(
  input: UpdateBudgetsInput,
): Promise<readonly BudgetWithCategory[]> {
  return await db.callFunction(
    "update_budgets",
    S.array(BudgetWithCategory),
    input,
  )
}
