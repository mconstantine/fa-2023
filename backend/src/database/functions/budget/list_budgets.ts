import * as S from "@effect/schema/Schema"
import * as db from "../../db"
import { type FunctionTemplate } from "../template"
import { BudgetWithCategory, type ListBudgetsInput } from "./domain"

export default {
  name: "list_budgets",
  args: [
    {
      mode: "IN",
      type: "integer",
      name: "target_year",
      defaultExpr: null,
    },
  ],
  returns: "jsonb",
  volatility: "STABLE",
  leakproof: true,
  parallel: "SAFE",
  cost: null,
} satisfies FunctionTemplate

export async function listBudgets(
  input: ListBudgetsInput,
): Promise<readonly BudgetWithCategory[]> {
  return await db.callFunction(
    "list_budgets",
    S.array(BudgetWithCategory),
    input.year,
  )
}
