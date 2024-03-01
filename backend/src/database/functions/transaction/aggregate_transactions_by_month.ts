import * as S from "@effect/schema/Schema"
import * as db from "../../db"
import { type FunctionTemplate } from "../template"
import {
  type AggregateTransactionsByMonthInput,
  TransactionByMonth,
} from "./domain"

export default {
  name: "aggregate_transactions_by_month",
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

export async function aggregateTransactionsByMonth(
  input: AggregateTransactionsByMonthInput,
): Promise<readonly TransactionByMonth[]> {
  return await db.callFunction(
    "aggregate_transactions_by_month",
    S.array(TransactionByMonth),
    input.year,
  )
}
