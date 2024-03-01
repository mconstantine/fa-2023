import * as S from "@effect/schema/Schema"

export { AggregateTransactionsByTimeAndCategoryInput } from "../../../../backend/src/database/functions/transaction/domain"

export const TransactionsByTimeAndCategory = S.struct({
  time: S.array(
    S.struct({
      time: S.number,
      total: S.number,
    }),
  ),
  categories: S.array(
    S.struct({
      id: S.UUID,
      name: S.string.pipe(S.nonEmpty()),
      is_meta: S.boolean,
      max_transaction_value: S.number,
      min_transaction_value: S.number,
      total: S.number,
    }),
  ),
})

export type TransactionsByTimeAndCategory = S.Schema.To<
  typeof TransactionsByTimeAndCategory
>
