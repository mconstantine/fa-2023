import { Option, pipe } from "effect"
import { BudgetWithCategory, TransactionByCategory } from "./domain"
import { constTrue } from "effect/Function"

export interface CategoryData {
  categoryId: Option.Option<string>
  categoryName: Option.Option<string>
  categoryIsProjectable: boolean
  totalTransactionsYearBefore: number
  totalTransactionsChosenYear: number
  budget: Option.Option<BudgetWithCategory>
}

export function mergeTransactionsAndBudgetsByCategory(input: {
  transactionsByCategoryYearBefore: readonly TransactionByCategory[]
  transactionsByCategoryChosenYear: readonly TransactionByCategory[]
  budgets: readonly BudgetWithCategory[]
}): readonly CategoryData[] {
  const allCategories = [
    ...input.transactionsByCategoryChosenYear.map((entry) => ({
      categoryId: Option.getOrNull(entry.category_id),
      categoryName: Option.getOrNull(entry.category_name),
      categoryIsProjectable: entry.category_is_projectable ?? true,
    })),
    ...input.transactionsByCategoryYearBefore.map((entry) => ({
      categoryId: Option.getOrNull(entry.category_id),
      categoryName: Option.getOrNull(entry.category_name),
      categoryIsProjectable: entry.category_is_projectable ?? true,
    })),
    ...input.budgets.map((entry) => ({
      categoryId: Option.getOrNull(entry.category_id),
      categoryName: pipe(
        entry.category,
        Option.map((category) => category.name),
        Option.getOrNull,
      ),
      categoryIsProjectable: pipe(
        entry.category,
        Option.map((category) => category.is_projectable),
        Option.getOrElse(constTrue),
      ),
    })),
  ]
    .sort((a, b) => {
      if (a.categoryName === null && b.categoryName === null) {
        return 0
      } else if (a.categoryName === null) {
        return 1
      } else if (b.categoryName === null) {
        return -1
      } else {
        return a.categoryName.localeCompare(b.categoryName)
      }
    })
    .filter(
      (element, index, list) =>
        list[index - 1]?.categoryId !== element.categoryId,
    )

  return allCategories.map((category) => ({
    categoryId: Option.fromNullable(category.categoryId),
    categoryName: Option.fromNullable(category.categoryName),
    categoryIsProjectable: category.categoryIsProjectable,
    totalTransactionsYearBefore:
      input.transactionsByCategoryYearBefore.find(
        (t) => Option.getOrNull(t.category_id) === category.categoryId,
      )?.transactions_total ?? 0,
    totalTransactionsChosenYear:
      input.transactionsByCategoryChosenYear.find(
        (t) => Option.getOrNull(t.category_id) === category.categoryId,
      )?.transactions_total ?? 0,
    budget: Option.fromNullable(
      input.budgets.find(
        (b) => Option.getOrNull(b.category_id) === category.categoryId,
      ),
    ),
  }))
}
