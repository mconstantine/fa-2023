import type * as S from "@effect/schema/Schema"
import { type FunctionTemplate } from "../template"
import { Budget } from "./domain"
import * as db from "../../db"
import { type User } from "../user/domain"

export default {
  name: "delete_budget",
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
  ],
  returns: "jsonb",
  volatility: "VOLATILE",
  leakproof: false,
  parallel: "UNSAFE",
  cost: null,
} satisfies FunctionTemplate

export async function deleteBudget(
  user: User,
  id: S.Schema.To<typeof S.UUID>,
): Promise<Budget> {
  return await db.callFunction("delete_budget", Budget, user.id, id)
}
