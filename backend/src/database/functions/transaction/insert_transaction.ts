import * as S from "@effect/schema/Schema"
import { type FunctionTemplate } from "../template"
import { TransactionWithCategories } from "./domain"
import * as db from "../../db"
import { ValueFromCurrency } from "../../domain"

export default {
  name: "insert_transaction",
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

export const InsertTransactionInput = S.struct({
  description: S.string.pipe(S.nonEmpty()),
  value: ValueFromCurrency,
  date: S.DateFromString,
  categoriesIds: S.array(S.UUID),
})

export interface InsertTransactionInput
  extends S.Schema.To<typeof InsertTransactionInput> {}

export async function insertTransaction(
  body: InsertTransactionInput,
): Promise<TransactionWithCategories> {
  return await db.callFunction(
    "insert_transaction",
    TransactionWithCategories,
    body,
  )
}
