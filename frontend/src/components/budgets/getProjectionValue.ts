import { CategoryData } from "./mergeTransactionsAndBudgetsByCategory"

export function getProjectionValue(categoryData: CategoryData): number {
  if (categoryData.categoryIsProjectable) {
    const currentMonth = Math.max(new Date().getUTCMonth(), 1)
    return (categoryData.totalTransactionsChosenYear / currentMonth) * 12
  } else {
    return categoryData.totalTransactionsChosenYear
  }
}
