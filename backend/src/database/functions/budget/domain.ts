import * as S from "@effect/schema/Schema"
import { Category } from "../category/domain"

export const Budget = S.struct({
  id: S.UUID,
  year: S.number.pipe(S.int()).pipe(S.positive()),
  value: S.number.pipe(
    S.transform(
      S.number,
      (n) => parseFloat((n / 100).toFixed(2)),
      (n) => Math.floor(n * 100),
    ),
  ),
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
