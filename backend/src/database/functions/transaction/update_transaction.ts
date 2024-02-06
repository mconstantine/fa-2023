import * as S from "@effect/schema/Schema"
import { type FunctionTemplate } from "../template"
import { TransactionWithCategories } from "./domain"
import * as db from "../../db"
import { ValueFromCurrency } from "../../domain"

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

export const UpdateTransactionInput = S.struct({
  description: S.optional(S.string.pipe(S.nonEmpty())),
  value: S.optional(ValueFromCurrency),
  date: S.optional(S.DateFromString),
  categoriesIds: S.optional(S.array(S.UUID)),
})

export interface UpdateTransactionInput
  extends S.Schema.To<typeof UpdateTransactionInput> {}

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
