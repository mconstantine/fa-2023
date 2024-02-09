import * as S from "@effect/schema/Schema"
import { Category } from "../category/domain"
import { CurrencyFromValue, ValueFromCurrency } from "../../domain"

export const Budget = S.struct({
  id: S.UUID,
  year: S.number.pipe(S.int()).pipe(S.positive()),
  value: CurrencyFromValue,
  category_id: S.nullable(S.UUID),
})

export interface Budget extends S.Schema.To<typeof Budget> {}

export const BudgetWithCategory = S.extend(
  Budget,
  S.struct({
    category: S.nullable(Category),
  }),
)

export interface BudgetWithCategory
  extends S.Schema.To<typeof BudgetWithCategory> {}

export const InsertBudgetInput = S.struct({
  year: S.number.pipe(S.int()).pipe(S.positive()),
  value: ValueFromCurrency,
  category_id: S.nullable(S.UUID),
})

export interface InsertBudgetInput
  extends S.Schema.To<typeof InsertBudgetInput> {}

export const UpdateBudgetInput = S.struct({
  year: S.optional(S.number.pipe(S.int()).pipe(S.positive())),
  value: S.optional(ValueFromCurrency),
  category_id: S.optional(S.nullable(S.UUID)),
})

export interface UpdateBudgetInput
  extends S.Schema.To<typeof UpdateBudgetInput> {}

export const UpdateBudgetsInput = S.array(
  S.struct({
    id: S.UUID,
    value: S.optional(ValueFromCurrency),
  }),
)

export interface UpdateBudgetsInput
  extends S.Schema.To<typeof UpdateBudgetsInput> {}
