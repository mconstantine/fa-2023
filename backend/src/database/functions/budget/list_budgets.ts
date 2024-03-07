import * as S from "@effect/schema/Schema"
import * as db from "../../db"
import { type FunctionTemplate } from "../template"
import { BudgetWithCategory, type ListBudgetsInput } from "./domain"
import { type User } from "../user/domain"

export default {
  name: "list_budgets",
  args: [
    {
      mode: "IN",
      type: "uuid",
      name: "owner_id",
      defaultExpr: null,
    },
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
  user: User,
  input: ListBudgetsInput,
): Promise<readonly BudgetWithCategory[]> {
  return await db.callFunction(
    "list_budgets",
    S.array(BudgetWithCategory),
    user.id,
    input.year,
  )
}
