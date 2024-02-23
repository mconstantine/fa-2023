import * as S from "@effect/schema/Schema"
import {
  InsertBudgetInput as ServerInsertBudgetInput,
  UpdateBudgetInput as ServerUpdateBudgetInput,
  Budget as ServerBudget,
  BudgetWithCategory as ServerBudgetWithCategory,
} from "../../../../backend/src/database/functions/budget/domain"
import { TransactionByCategory as ServerTransactionByCategory } from "../../../../backend/src/database/functions/transaction/domain"
import { Category } from "../categories/domain"

export const ListBudgetsFilters = S.struct({
  year: S.NumberFromString.pipe(S.int()).pipe(S.positive()),
})

export const Budget = S.extend(
  S.omit<ServerBudget, ["value", "category_id"]>(
    "value",
    "category_id",
  )(ServerBudget),
  S.struct({
    value: S.number,
    category_id: S.optionFromNullable(S.UUID),
  }),
)

export interface Budget extends S.Schema.To<typeof Budget> {}

export const BudgetWithCategory = S.extend(
  S.omit<ServerBudgetWithCategory, ["value", "category_id", "category"]>(
    "value",
    "category_id",
    "category",
  )(ServerBudgetWithCategory),
  S.struct({
    value: S.number,
    category_id: S.optionFromNullable(S.UUID),
    category: S.optionFromNullable(Category),
  }),
)

export interface BudgetWithCategory
  extends S.Schema.To<typeof BudgetWithCategory> {}

export const TransactionByCategory = S.extend(
  S.omit<
    ServerTransactionByCategory,
    ["category_id", "category_name", "transactions_total"]
  >(
    "category_id",
    "category_name",
    "transactions_total",
  )(ServerTransactionByCategory),
  S.struct({
    category_id: S.optionFromNullable(S.UUID),
    category_name: S.optionFromNullable(S.Trim.pipe(S.nonEmpty())),
    transactions_total: S.number,
  }),
)

export interface TransactionByCategory
  extends S.Schema.To<typeof TransactionByCategory> {}

export const InsertBudgetInput = S.extend(
  S.omit<ServerInsertBudgetInput, ["value", "category_id"]>(
    "value",
    "category_id",
  )(ServerInsertBudgetInput),
  S.struct({
    value: S.number,
    category_id: S.optionFromNullable(S.UUID),
  }),
)

export interface InsertBudgetInput
  extends S.Schema.To<typeof InsertBudgetInput> {}

export const UpdateBudgetInput = S.extend(
  S.omit<ServerUpdateBudgetInput, ["value", "category_id"]>(
    "value",
    "category_id",
  )(ServerUpdateBudgetInput),
  S.struct({
    value: S.number,
    category_id: S.optionFromNullable(S.UUID),
  }),
)

export interface UpdateBudgetInput
  extends S.Schema.To<typeof UpdateBudgetInput> {}
