import * as S from "@effect/schema/Schema"
import * as db from "../../db"
import { type FunctionTemplate } from "../template"
import {
  type AggregateTransactionsByCategoryInput,
  TransactionByCategory,
} from "./domain"
import { type User } from "../user/domain"

export default {
  name: "aggregate_transactions_by_category",
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
      name: "year",
      defaultExpr: null,
    },
  ],
  returns: "jsonb",
  volatility: "STABLE",
  leakproof: true,
  parallel: "SAFE",
  cost: null,
} satisfies FunctionTemplate

export async function aggregateTransactionsByCategory(
  user: User,
  input: AggregateTransactionsByCategoryInput,
): Promise<readonly TransactionByCategory[]> {
  return await db.callFunction(
    "aggregate_transactions_by_category",
    S.array(TransactionByCategory),
    user.id,
    input.year,
  )
}
