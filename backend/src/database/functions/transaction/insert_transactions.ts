import * as S from "@effect/schema/Schema"
import { type FunctionTemplate } from "../template"
import { InsertTransactionInput, TransactionWithCategories } from "./domain"
import * as db from "../../db"
import { type User } from "../user/domain"

export default {
  name: "insert_transactions",
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

export const InsertTransactionsInput = S.array(InsertTransactionInput)

export interface InsertTransactionsInput
  extends S.Schema.To<typeof InsertTransactionsInput> {}

export async function insertTransactions(
  user: User,
  body: InsertTransactionsInput,
): Promise<readonly TransactionWithCategories[]> {
  return await db.callFunction(
    "insert_transactions",
    S.array(TransactionWithCategories),
    user.id,
    body,
  )
}
