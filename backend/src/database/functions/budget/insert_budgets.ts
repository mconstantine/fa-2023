import * as S from "@effect/schema/Schema"
import { type FunctionTemplate } from "../template"
import { type InsertBudgetInput } from "./insert_budget"
import { BudgetWithCategory } from "./domain"
import * as db from "../../db"

export default {
  name: "insert_budgets",
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

export async function insertBudgets(
  input: InsertBudgetInput[],
): Promise<readonly BudgetWithCategory[]> {
  return await db.callFunction(
    "insert_budgets",
    S.array(BudgetWithCategory),
    input,
  )
}
