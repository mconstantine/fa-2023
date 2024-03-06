import * as S from "@effect/schema/Schema"
import { insertBudget } from "../functions/budget/insert_budget"
import { type Category } from "../functions/category/domain"
import { insertCategory } from "../functions/category/insert_category"
import {
  Budget,
  type BudgetWithCategory,
  InsertBudgetInput,
  UpdateBudgetInput,
  UpdateBudgetsInput,
} from "../functions/budget/domain"
import { insertBudgets } from "../functions/budget/insert_budgets"
import * as db from "../db"
import { updateBudget } from "../functions/budget/update_budget"
import { updateBudgets } from "../functions/budget/update_budgets"
import { deleteBudget } from "../functions/budget/delete_budget"
import { listBudgets } from "../functions/budget/list_budgets"
import { Either } from "effect"
import { insertUser } from "../functions/user/insert_user"
import { type User } from "../functions/user/domain"

/* eslint-disable @typescript-eslint/no-non-null-assertion */

describe("database budget functions", () => {
  let user: User
  let culprit: User
  let categories: Category[]

  beforeAll(async () => {
    user = await insertUser({
      name: "Budget Tests",
      email: "budget.tests@example.com",
      password: "P4ssw0rd!",
    })

    culprit = await insertUser({
      name: "Budget Tests Culprit",
      email: "budget.tests.culprit@example.com",
      password: "P4ssw0rd!",
    })

    categories = [
      await insertCategory(user, {
        name: "Budget tests category 1",
        is_meta: false,
        is_projectable: false,
        keywords: [],
      }),
      await insertCategory(user, {
        name: "Budget tests category 2",
        is_meta: false,
        is_projectable: false,
        keywords: [],
      }),
    ]
  })

  afterEach(async () => {
    await db.query("delete from budget")
  })

  afterAll(async () => {
    await db.query('delete from "user"')
  })

  describe("insert budget", () => {
    it("should work and convert the value", async () => {
      const result = await insertBudget(
        user,
        S.decodeSync(InsertBudgetInput)({
          year: 2020,
          value: 1.5,
          category_id: null,
        }),
      )

      expect(S.is(S.UUID)(result.id)).toBe(true)
      expect(result.value).toBe(1.5)
      expect(result.category).toBeNull()
    })

    it("should save the category if needed", async () => {
      const result = await insertBudget(user, {
        year: 2020,
        value: 10000,
        category_id: categories[0]!.id,
      })

      expect(result.category).toEqual(categories[0])
    })
  })

  describe("bulk budgets insertion", () => {
    it("should work and convert the values", async () => {
      const result = await insertBudgets(user, [
        {
          year: 2020,
          value: 10000,
          category_id: null,
        },
        {
          year: 2020,
          value: 5000,
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
      await insertBudgets(user, [
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
    let budget: BudgetWithCategory

    beforeEach(async () => {
      budget = await insertBudget(user, {
        year: 2020,
        value: 10000,
        category_id: categories[0]!.id,
      })
    })

    it("should work and convert the value", async () => {
      const updated = await updateBudget(
        user,
        budget.id,
        S.decodeSync(UpdateBudgetInput)({
          year: 2021,
          value: 1.5,
          category_id: categories[1]!.id,
        }),
      )

      expect(updated.id).toEqual(budget.id)
      expect(updated.value).toBe(1.5)
      expect(updated.category).toEqual(categories[1])
    })

    it("should not allow to update budgets of other users", async () => {
      await expect(
        async () => await updateBudget(culprit, budget.id, {}),
      ).rejects.toBeTruthy()
    })

    it("should work with an empty update", async () => {
      const updated = await updateBudget(user, budget.id, {})

      expect(updated.id).toEqual(budget.id)
      expect(updated.value).toBe(budget.value)
      expect(updated.category).toEqual(budget.category)
    })
  })

  describe.only("bulk budgets update", () => {
    it("should work and convert the values", async () => {
      const budgets = await insertBudgets(user, [
        {
          year: 2020,
          value: 4200,
          category_id: categories[0]!.id,
        },
        {
          year: 2020,
          value: 6900,
          category_id: categories[1]!.id,
        },
      ])

      const result = await updateBudgets(
        S.decodeSync(UpdateBudgetsInput)([
          {
            id: budgets[0]!.id,
            value: 6.9,
          },
          {
            id: budgets[1]!.id,
            value: 4.2,
          },
        ]),
      )

      expect(result[0]?.value).toBe(6.9)
      expect(result[1]?.value).toBe(4.2)
    })

    it.todo("should not allowa to update budgets of other users")

    it("should work with an empty update", async () => {
      const budgets = await insertBudgets(user, [
        {
          year: 2020,
          value: 4200,
          category_id: categories[0]!.id,
        },
        {
          year: 2020,
          value: 6900,
          category_id: categories[1]!.id,
        },
      ])

      const result = await updateBudgets([
        {
          id: budgets[0]!.id,
        },
        {
          id: budgets[1]!.id,
        },
      ])

      expect(result[0]?.value).toBe(budgets[0]?.value)
      expect(result[1]?.value).toBe(budgets[1]?.value)
    })
  })

  describe("delete budget", () => {
    it("should work", async () => {
      const budget = await insertBudget(user, {
        year: 2020,
        value: 10000,
        category_id: null,
      })

      const result = await deleteBudget(budget.id)

      expect(result.id).toBe(budget.id)

      const budgetAfterDeletion = await db.getOne(
        Budget,
        "select * from transaction where id = $1",
        [budget.id],
      )

      expect(Either.isLeft(budgetAfterDeletion)).toBe(true)
    })
  })

  describe("list budgets", () => {
    it("should work with empty table", async () => {
      await db.query("delete from budget")
      const result = await listBudgets({ year: 2020 })
      expect(result).toEqual([])
    })

    it("should work and filter by year", async () => {
      const budgets = await insertBudgets(user, [
        {
          year: 2020,
          value: 4200,
          category_id: categories[0]!.id,
        },
        {
          year: 2020,
          value: 6900,
          category_id: categories[1]!.id,
        },
        {
          year: 2021,
          value: 4200,
          category_id: categories[0]!.id,
        },
        {
          year: 2021,
          value: 6900,
          category_id: categories[1]!.id,
        },
      ])

      const result = await listBudgets({ year: 2021 })
      expect(result).toEqual(budgets.slice(2))
    })
  })
})
