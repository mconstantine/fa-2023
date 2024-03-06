import * as S from "@effect/schema/Schema"
import { type FunctionTemplate } from "../template"
import { BudgetWithCategory, type InsertBudgetInput } from "./domain"
import * as db from "../../db"
import { type User } from "../user/domain"

export default {
  name: "insert_budgets",
  args: [
    {
      mode: "IN",
      type: "uuid",
      name: "owner_id",
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

export async function insertBudgets(
  user: User,
  input: readonly InsertBudgetInput[],
): Promise<readonly BudgetWithCategory[]> {
  return await db.callFunction(
    "insert_budgets",
    S.array(BudgetWithCategory),
    user.id,
    input,
  )
}
