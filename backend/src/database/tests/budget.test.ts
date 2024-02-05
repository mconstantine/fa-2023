import * as S from "@effect/schema/Schema"
import { insertBudget } from "../functions/budget/insert_budget"
import { type Category } from "../functions/category/domain"
import { insertCategory } from "../functions/category/insert_category"
import { BudgetWithCategory } from "../functions/budget/domain"
import { insertBudgets } from "../functions/budget/insert_budgets"
import * as db from "../db"
import { updateBudget } from "../functions/budget/update_budget"

describe("database budget functions", () => {
  let categories: Category[]

  beforeAll(async () => {
    categories = [
      await insertCategory({
        name: "Budget tests category 1",
        is_meta: false,
        keywords: [],
      }),
      await insertCategory({
        name: "Budget tests category 2",
        is_meta: false,
        keywords: [],
      }),
    ]
  })

  afterEach(async () => {
    await db.query("delete from budget")
  })

  afterAll(async () => {
    await db.query("delete from category")
  })

  describe("insert budget", () => {
    it("should work and convert the value", async () => {
      const result = await insertBudget({
        year: 2020,
        value: 10000,
        category_id: null,
      })

      expect(S.is(S.UUID)(result.id)).toBe(true)
      expect(S.is(BudgetWithCategory)(result)).toBe(true)
      expect(result.category).toBeNull()
    })

    it("should save the category if needed", async () => {
      const result = await insertBudget({
        year: 2020,
        value: 10000,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        category_id: categories[0]!.id,
      })

      expect(result.category).toEqual(categories[0])
    })
  })

  describe("bulk budgets insertion", () => {
    it("should work and convert the values", async () => {
      const result = await insertBudgets([
        {
          year: 2020,
          value: 10000,
          category_id: null,
        },
        {
          year: 2020,
          value: 5000,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          category_id: categories[0]!.id,
        },
      ])

      expect(result[0]?.value).toBe(100)
      expect(result[0]?.category).toBeNull()
      expect(result[1]?.value).toBe(50)
      expect(result[1]?.category).toEqual(categories[0])
    })
  })

  it("should enforce a unique budget per category and year", async () => {
    await expect(async () => {
      await insertBudgets([
        {
          year: 2020,
          value: 10000,
          category_id: null,
        },
        {
          year: 2020,
          value: 5000,
          category_id: null,
        },
      ])
    }).rejects.toBeTruthy()
  })

  describe("update budget", () => {
    it("should work and convert the value", async () => {
      const budget = await insertBudget({
        year: 2020,
        value: 10000,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        category_id: categories[0]!.id,
      })

      const updated = await updateBudget(budget.id, {
        year: 2021,
        value: 50000,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        category_id: categories[1]!.id,
      })

      expect(updated.id).toEqual(budget.id)
      expect(updated.value).toBe(500)
      expect(updated.category).toEqual(categories[1])
    })

    it("should work with an empty update", async () => {
      const budget = await insertBudget({
        year: 2020,
        value: 10000,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        category_id: categories[0]!.id,
      })

      const updated = await updateBudget(budget.id, {})

      expect(updated.id).toEqual(budget.id)
      expect(updated.value).toBe(budget.value)
      expect(updated.category).toEqual(budget.category)
    })
  })

  describe("bulk budgets update", () => {
    it.todo("should work and convert the values")
    it.todo("should work with an empty update")
  })

  describe("delete budget", () => {
    it.todo("should work")
    // TODO: create a test case for categories that tests that budgets are deleted when a category is
  })

  describe("list budgets", () => {
    it.todo("should work and filter by year")
  })
})
