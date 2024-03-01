import * as S from "@effect/schema/Schema"
import * as db from "../../db"
import { type FunctionTemplate } from "../template"
import {
  type AggregateTransactionsByCategoryInput,
  TransactionByCategory,
} from "./domain"

export default {
  name: "aggregate_transactions_by_category",
  args: [
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
  input: AggregateTransactionsByCategoryInput,
): Promise<readonly TransactionByCategory[]> {
  return await db.callFunction(
    "aggregate_transactions_by_category",
    S.array(TransactionByCategory),
    input.year,
  )
}
