import * as S from "@effect/schema/Schema"
import { type FunctionTemplate } from "../template"
import { UpdateTransactionInput } from "./update_transaction"
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

export const UpdateTransactionsInput = S.extend(
  UpdateTransactionInput,
  S.struct({
    ids: S.array(S.UUID),
  }),
)

export interface UpdateTransactionsInput
  extends S.Schema.To<typeof UpdateTransactionsInput> {}

export async function updateTransactions(
  input: UpdateTransactionsInput,
): Promise<readonly TransactionWithCategories[]> {
  const { ids, ...body } = input

  return await db.callFunction(
    "update_transactions",
    S.array(TransactionWithCategories),
    `{${ids.join(", ")}}`,
    body,
  )
}
