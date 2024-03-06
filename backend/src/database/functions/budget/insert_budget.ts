import { type FunctionTemplate } from "../template"
import { BudgetWithCategory, type InsertBudgetInput } from "./domain"
import * as db from "../../db"
import { type User } from "../user/domain"

export default {
  name: "insert_budget",
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

export async function insertBudget(
  user: User,
  input: InsertBudgetInput,
): Promise<BudgetWithCategory> {
  return await db.callFunction(
    "insert_budget",
    BudgetWithCategory,
    user.id,
    input,
  )
}
