import * as S from "@effect/schema/Schema"
import { type FunctionTemplate } from "../template"
import { type UpdateTransactionInput } from "./update_transaction"
import { TransactionWithCategories } from "./domain"
import * as db from "../../db"

export default {
  name: "update_transactions",
  args: [
    {
      mode: "IN",
      type: "uuid[]",
      name: "ids",
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

const UpdateTransactionsIds = S.array(S.UUID)

export async function updateTransactions(
  ids: S.Schema.To<typeof UpdateTransactionsIds>,
  body: UpdateTransactionInput,
): Promise<readonly TransactionWithCategories[]> {
  return await db.callFunction(
    "update_transactions",
    S.array(TransactionWithCategories),
    `{${ids.join(", ")}}`,
    body,
  )
}
