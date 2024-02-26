import * as db from "../../db"
import { type FunctionTemplate } from "../template"
import {
  type AggregateTransactionsByTimeAndCategoryInput,
  TransactionsByTimeAndCategory,
} from "./domain"

export default {
  name: "aggregate_transactions_by_time_and_category",
  args: [
    {
      mode: "IN",
      type: "jsonb",
      name: "filters",
      defaultExpr: null,
    },
  ],
  returns: "jsonb",
  volatility: "STABLE",
  leakproof: true,
  parallel: "SAFE",
  cost: null,
} satisfies FunctionTemplate

export async function aggregateTransactionsByTimeAndCategory(
  input: AggregateTransactionsByTimeAndCategoryInput,
): Promise<TransactionsByTimeAndCategory> {
  return await db.callFunction(
    "aggregate_transactions_by_time_and_category",
    TransactionsByTimeAndCategory,
    input,
  )
}
