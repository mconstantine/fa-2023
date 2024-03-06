import { type FunctionTemplate } from "../template"
import {
  type InsertTransactionInput,
  TransactionWithCategories,
} from "./domain"
import * as db from "../../db"
import { type User } from "../user/domain"

export default {
  name: "insert_transaction",
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

export async function insertTransaction(
  user: User,
  body: InsertTransactionInput,
): Promise<TransactionWithCategories> {
  return await db.callFunction(
    "insert_transaction",
    TransactionWithCategories,
    user.id,
    body,
  )
}
