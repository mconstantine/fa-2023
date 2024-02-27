import { v4 } from "uuid"
import { BudgetWithCategory, TransactionByCategory } from "./domain"
import {
  CategoryData,
  mergeTransactionsAndBudgetsByCategory,
} from "./mergeTransactionsAndBudgetsByCategory"
import { Option } from "effect"
import { Category } from "../categories/domain"

describe("mergeTransactionsAndBudgetsByCategory", () => {
  it("should work with no data", () => {
    const transactionsByCategoryYearBefore: TransactionByCategory[] = []
    const transactionsByCategoryChosenYear: TransactionByCategory[] = []
    const budgets: BudgetWithCategory[] = []

    const result = mergeTransactionsAndBudgetsByCategory({
      transactionsByCategoryYearBefore,
      transactionsByCategoryChosenYear,
      budgets,
    })

    expect(result).toEqual([])
  })

  it("should work with matching categories", () => {
    const category1: Category = {
      id: v4(),
      name: "Category 1",
      is_meta: false,
      is_projectable: false,
      keywords: [],
    }

    const category2: Category = {
      id: v4(),
      name: "Category 2",
      is_meta: false,
      is_projectable: false,
      keywords: [],
    }

    const transactionsByCategoryYearBefore: TransactionByCategory[] = [
      {
        category_id: Option.some(category1.id),
        category_name: Option.some(category1.name),
        transactions_total: 100.42,
      },
      {
        category_id: Option.some(category2.id),
        category_name: Option.some(category2.name),
        transactions_total: 69.66,
      },
      {
        category_id: Option.none(),
        category_name: Option.none(),
        transactions_total: 666.66,
      },
    ]

    const transactionsByCategoryChosenYear: TransactionByCategory[] = [
      {
        category_id: Option.some(category1.id),
        category_name: Option.some(category1.name),
        transactions_total: 149.58,
      },
      {
        category_id: Option.some(category2.id),
        category_name: Option.some(category2.name),
        transactions_total: 30.34,
      },
      {
        category_id: Option.none(),
        category_name: Option.none(),
        transactions_total: 333.34,
      },
    ]

    const budgets: BudgetWithCategory[] = [
      {
        id: v4(),
        year: 2020,
        value: 250,
        category_id: Option.some(category1.id),
        category: Option.some(category1),
      },
      {
        id: v4(),
        year: 2020,
        value: 100,
        category_id: Option.some(category2.id),
        category: Option.some(category2),
      },
      {
        id: v4(),
        year: 2020,
        value: 1000,
        category_id: Option.none(),
        category: Option.none(),
      },
    ]

    const result = mergeTransactionsAndBudgetsByCategory({
      transactionsByCategoryYearBefore,
      transactionsByCategoryChosenYear,
      budgets,
    })

    const expected: CategoryData[] = [
      {
        categoryId: Option.some(category1.id),
        categoryName: Option.some(category1.name),
        totalTransactionsYearBefore: 100.42,
        totalTransactionsChosenYear: 149.58,
        budget: Option.some(budgets[0]!),
      },
      {
        categoryId: Option.some(category2.id),
        categoryName: Option.some(category2.name),
        totalTransactionsYearBefore: 69.66,
        totalTransactionsChosenYear: 30.34,
        budget: Option.some(budgets[1]!),
      },
      {
        categoryId: Option.none(),
        categoryName: Option.none(),
        totalTransactionsYearBefore: 666.66,
        totalTransactionsChosenYear: 333.34,
        budget: Option.some(budgets[2]!),
      },
    ]

    expect(result).toEqual(expected)
  })

  it("should work with matching partially matching categories", () => {
    const category1: Category = {
      id: v4(),
      name: "Category 1",
      is_meta: false,
      is_projectable: false,
      keywords: [],
    }

    const category2: Category = {
      id: v4(),
      name: "Category 2",
      is_meta: false,
      is_projectable: false,
      keywords: [],
    }

    const category3: Category = {
      id: v4(),
      name: "Category 3",
      is_meta: false,
      is_projectable: false,
      keywords: [],
    }

    const transactionsByCategoryYearBefore: TransactionByCategory[] = [
      {
        category_id: Option.some(category1.id),
        category_name: Option.some(category1.name),
        transactions_total: 10,
      },
      {
        category_id: Option.some(category2.id),
        category_name: Option.some(category2.name),
        transactions_total: 10,
      },
      {
        category_id: Option.none(),
        category_name: Option.none(),
        transactions_total: 15,
      },
    ]

    const transactionsByCategoryChosenYear: TransactionByCategory[] = [
      {
        category_id: Option.some(category2.id),
        category_name: Option.some(category2.name),
        transactions_total: 10,
      },
      {
        category_id: Option.some(category3.id),
        category_name: Option.some(category3.name),
        transactions_total: 10,
      },
      {
        category_id: Option.none(),
        category_name: Option.none(),
        transactions_total: 15,
      },
    ]

    const budgets: BudgetWithCategory[] = []

    const result = mergeTransactionsAndBudgetsByCategory({
      transactionsByCategoryYearBefore,
      transactionsByCategoryChosenYear,
      budgets,
    })

    const expected: CategoryData[] = [
      {
        categoryId: Option.some(category1.id),
        categoryName: Option.some(category1.name),
        totalTransactionsYearBefore: 10,
        totalTransactionsChosenYear: 0,
        budget: Option.none(),
      },
      {
        categoryId: Option.some(category2.id),
        categoryName: Option.some(category2.name),
        totalTransactionsYearBefore: 10,
        totalTransactionsChosenYear: 10,
        budget: Option.none(),
      },
      {
        categoryId: Option.some(category3.id),
        categoryName: Option.some(category3.name),
        totalTransactionsYearBefore: 0,
        totalTransactionsChosenYear: 10,
        budget: Option.none(),
      },
      {
        categoryId: Option.none(),
        categoryName: Option.none(),
        totalTransactionsYearBefore: 15,
        totalTransactionsChosenYear: 15,
        budget: Option.none(),
      },
    ]

    expect(result).toEqual(expected)
  })

  it("should work with different categories", () => {
    const category1: Category = {
      id: v4(),
      name: "Category 1",
      is_meta: false,
      is_projectable: false,
      keywords: [],
    }

    const category2: Category = {
      id: v4(),
      name: "Category 2",
      is_meta: false,
      is_projectable: false,
      keywords: [],
    }

    const category3: Category = {
      id: v4(),
      name: "Category 3",
      is_meta: false,
      is_projectable: false,
      keywords: [],
    }

    const transactionsByCategoryYearBefore: TransactionByCategory[] = [
      {
        category_id: Option.some(category1.id),
        category_name: Option.some(category1.name),
        transactions_total: 10,
      },
    ]

    const transactionsByCategoryChosenYear: TransactionByCategory[] = [
      {
        category_id: Option.some(category2.id),
        category_name: Option.some(category2.name),
        transactions_total: 10,
      },
    ]

    const budgets: BudgetWithCategory[] = [
      {
        id: v4(),
        year: 2020,
        value: 10,
        category_id: Option.some(category3.id),
        category: Option.some(category3),
      },
    ]

    const result = mergeTransactionsAndBudgetsByCategory({
      transactionsByCategoryYearBefore,
      transactionsByCategoryChosenYear,
      budgets,
    })

    const expected: CategoryData[] = [
      {
        categoryId: Option.some(category1.id),
        categoryName: Option.some(category1.name),
        totalTransactionsYearBefore: 10,
        totalTransactionsChosenYear: 0,
        budget: Option.none(),
      },
      {
        categoryId: Option.some(category2.id),
        categoryName: Option.some(category2.name),
        totalTransactionsYearBefore: 0,
        totalTransactionsChosenYear: 10,
        budget: Option.none(),
      },
      {
        categoryId: Option.some(category3.id),
        categoryName: Option.some(category3.name),
        totalTransactionsYearBefore: 0,
        totalTransactionsChosenYear: 0,
        budget: Option.some(budgets[0]!),
      },
    ]

    expect(result).toEqual(expected)
  })
})
