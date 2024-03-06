import type * as S from "@effect/schema/Schema"
import { type FunctionTemplate } from "../template"
import * as db from "../../db"
import { BudgetWithCategory, type UpdateBudgetInput } from "./domain"
import { type User } from "../user/domain"

export default {
  name: "update_budget",
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

export async function updateBudget(
  user: User,
  id: S.Schema.To<typeof S.UUID>,
  body: UpdateBudgetInput,
): Promise<BudgetWithCategory> {
  return await db.callFunction(
    "update_budget",
    BudgetWithCategory,
    user.id,
    id,
    body,
  )
}
