import type * as S from "@effect/schema/Schema"
import { type FunctionTemplate } from "../template"
import {
  TransactionWithCategories,
  type UpdateTransactionInput,
} from "./domain"
import * as db from "../../db"

export default {
  name: "update_transaction",
  args: [
    {
      mode: "IN",
      type: "uuid",
      name: "target_id",
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

export async function updateTransaction(
  id: S.Schema.To<typeof S.UUID>,
  body: UpdateTransactionInput,
): Promise<TransactionWithCategories> {
  return await db.callFunction(
    "update_transaction",
    TransactionWithCategories,
    id,
    body,
  )
}
