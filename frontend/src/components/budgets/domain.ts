import * as S from "@effect/schema/Schema"
import {
  InsertBudgetInput as ServerInsertBudgetInput,
  UpdateBudgetInput as ServerUpdateBudgetInput,
  BudgetWithCategory as ServerBudgetWithCategory,
} from "../../../../backend/src/database/functions/budget/domain"
import { TransactionByCategory as ServerTransactionByCategory } from "../../../../backend/src/database/functions/transaction/domain"

export const ListBudgetsFilters = S.struct({
  year: S.NumberFromString.pipe(S.int()).pipe(S.positive()),
})

export const BudgetWithCategory = S.extend(
  S.omit<ServerBudgetWithCategory, ["value"]>("value")(
    ServerBudgetWithCategory,
  ),
  S.struct({
    value: S.number,
  }),
)

export const TransactionByCategory = S.extend(
  S.omit<ServerTransactionByCategory, ["transactions_total"]>(
    "transactions_total",
  )(ServerTransactionByCategory),
  S.struct({
    transactions_total: S.number,
  }),
)

export const InsertBudgetInput = S.extend(
  S.omit<ServerInsertBudgetInput, ["value"]>("value")(ServerInsertBudgetInput),
  S.struct({
    value: S.number,
  }),
)

export interface InsertBudgetInput
  extends S.Schema.To<typeof InsertBudgetInput> {}

export const UpdateBudgetInput = S.extend(
  S.omit<ServerUpdateBudgetInput, ["value"]>("value")(ServerUpdateBudgetInput),
  S.struct({
    value: S.number,
  }),
)

export interface UpdateBudgetInput
  extends S.Schema.To<typeof UpdateBudgetInput> {}
