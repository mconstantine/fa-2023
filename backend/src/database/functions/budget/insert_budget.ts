import * as S from "@effect/schema/Schema"
import { type FunctionTemplate } from "../template"
import { BudgetWithCategory } from "./domain"
import * as db from "../../db"

export default {
  name: "insert_budget",
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

export const InsertBudgetInput = S.struct({
  year: S.number.pipe(S.int()).pipe(S.positive()),
  value: S.number.pipe(
    S.transform(
      S.number,
      (n) => parseFloat((n / 100).toFixed(2)),
      (n) => Math.floor(n * 100),
    ),
  ),
  category_id: S.nullable(S.UUID),
})

export interface InsertBudgetInput
  extends S.Schema.To<typeof InsertBudgetInput> {}

export async function insertBudget(
  input: InsertBudgetInput,
): Promise<BudgetWithCategory> {
  return await db.callFunction("insert_budget", BudgetWithCategory, input)
}
