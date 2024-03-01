import type * as S from "@effect/schema/Schema"
import * as db from "../../db"
import { type FunctionTemplate } from "../template"
import { Transaction } from "./domain"

export default {
  name: "delete_transaction",
  args: [
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

export async function deleteTransaction(
  id: S.Schema.To<typeof S.UUID>,
): Promise<Transaction> {
  return await db.callFunction("delete_transaction", Transaction, id)
}
