import * as S from "@effect/schema/Schema"
import { type FunctionTemplate } from "../template"
import { Transaction } from "./domain"
import { type InsertTransactionInput } from "./insert_transaction"
import * as db from "../../db"

export default {
  name: "insert_transactions",
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

export async function insertTransactions(
  body: InsertTransactionInput[],
): Promise<readonly Transaction[]> {
  return await db.callFunction(
    "insert_transactions",
    S.array(Transaction),
    body,
  )
}
