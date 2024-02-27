import * as S from "@effect/schema/Schema"
import { insertCategory } from "../functions/category/insert_category"
import * as db from "../db"
import {
  Category,
  type InsertCategoryInput,
} from "../functions/category/domain"
import { updateCategory } from "../functions/category/update_category"
import { deleteCategory } from "../functions/category/delete_category"
import { listCategories } from "../functions/category/list_categories"
import { PaginationResponse } from "../domain"
import { insertTransaction } from "../functions/transaction/insert_transaction"
import { insertBudget } from "../functions/budget/insert_budget"
import { Budget } from "../functions/budget/domain"

describe("database category functions", () => {
  afterAll(async () => {
    await db.query("delete from category")
  })

  describe("insert category", () => {
    it("should work with all data", async () => {
      const result = await insertCategory({
        name: "Insert category test",
        is_meta: false,
        keywords: ["keyword"],
      })

      expect(S.is(S.UUID)(result.id)).toBe(true)
      expect(S.is(Category)(result)).toBe(true)
    })

    it("should work with empty keywords array", async () => {
      const result = await insertCategory({
        name: "Insert category test empty keywords",
        is_meta: true,
        keywords: [],
      })

      expect(S.is(S.UUID)(result.id)).toBe(true)
      expect(S.is(Category)(result)).toBe(true)
    })
  })

  describe("update category", () => {
    it("should work", async () => {
      const category = await insertCategory({
        name: "Update category test",
        is_meta: false,
        keywords: ["keyword"],
      })

      const result = await updateCategory(category.id, {
        is_meta: true,
        keywords: [],
      })

      expect(result.id).toBe(category.id)
      expect(result.is_meta).toBe(true)
      expect(result.keywords).toEqual([])
    })
  })

  describe("delete category", () => {
    it("should work", async () => {
      const category = await insertCategory({
        name: "Delete category test",
        is_meta: false,
        keywords: ["keyword"],
      })

      const result = await deleteCategory(category.id)

      expect(result.id).toBe(category.id)

      await expect(async () => {
        await db.getOne(Category, "select * from category where id = $1", [
          category.id,
        ])
      }).rejects.toBeTruthy()
    })

    it("should cascade on transactions", async () => {
      const TransactionsCategories = S.struct({
        transaction_id: S.UUID,
        category_id: S.UUID,
      })

      const category = await insertCategory({
        name: "Relationship with transactions test",
        is_meta: false,
        keywords: [],
      })

      const transaction = await insertTransaction({
        description: "Relationship with categories test",
        value: 690,
        date: new Date(2020, 0, 1),
        categories_ids: [category.id],
      })

      const relationshipBefore = await db.getMany(
        TransactionsCategories,
        "select * from transactions_categories where transaction_id = $1",
        [transaction.id],
      )

      expect(relationshipBefore.length).toBe(1)

      await deleteCategory(category.id)

      const relationshipAfter = await db.getMany(
        TransactionsCategories,
        "select * from transactions_categories where transaction_id = $1",
        [transaction.id],
      )

      expect(relationshipAfter.length).toBe(0)
    })

    it("should cascade on budgets", async () => {
      const category = await insertCategory({
        name: "Relationship with budgets test",
        is_meta: false,
        keywords: [],
      })

      const budget = await insertBudget({
        year: 2020,
        value: 4200,
        category_id: category.id,
      })

      await deleteCategory(category.id)

      await expect(
        async () =>
          await db.getOne(Budget, "select * from budget where id = $1", [
            budget.id,
          ]),
      ).rejects.toBeTruthy()
    })
  })

  describe("list categories", () => {
    describe("with empty table", () => {
      beforeAll(async () => {
        await db.query("delete from category")
      })

      it("should work", async () => {
        const result = S.encodeSync(PaginationResponse(Category))(
          await listCategories({
            search_query: "",
            direction: "forward",
            count: 10,
          }),
        )

        expect(result).toEqual({
          page_info: {
            total_count: 0,
            start_cursor: null,
            end_cursor: null,
            has_previous_page: false,
            has_next_page: false,
          },
          edges: [],
        })
      })
    })

    describe("with data", () => {
      let categories: Category[]

      beforeAll(async () => {
        categories = await Promise.all(
          (
            [
              {
                name: "AX",
                is_meta: true,
                keywords: [],
              },
              {
                name: "BX",
                is_meta: true,
                keywords: [],
              },
              {
                name: "CX",
                is_meta: true,
                keywords: [],
              },
              {
                name: "DX",
                is_meta: false,
                keywords: [],
              },
              {
                name: "EX",
                is_meta: false,
                keywords: [],
              },
              {
                name: "FX",
                is_meta: false,
                keywords: [],
              },
              {
                name: "G",
                is_meta: false,
                keywords: [],
              },
            ] satisfies InsertCategoryInput[]
          ).map(async (category) => await insertCategory(category)),
        )
      })

      it("should work", async () => {
        const result = S.encodeSync(PaginationResponse(Category))(
          await listCategories({
            search_query: "x",
            direction: "forward",
            count: 2,
          }),
        )

        expect(result).toEqual({
          page_info: {
            total_count: 6,
            start_cursor: categories[0]?.id,
            end_cursor: categories[1]?.id,
            has_previous_page: false,
            has_next_page: true,
          },
          edges: [
            {
              cursor: categories[0]?.id,
              node: categories[0],
            },
            {
              cursor: categories[1]?.id,
              node: categories[1],
            },
          ],
        })
      })

      it("should work in forward direction, first page", async () => {
        const result = S.encodeSync(PaginationResponse(Category))(
          await listCategories({
            search_query: "",
            direction: "forward",
            count: 3,
          }),
        )

        expect(result).toEqual({
          page_info: {
            total_count: 7,
            start_cursor: categories[0]?.id,
            end_cursor: categories[2]?.id,
            has_previous_page: false,
            has_next_page: true,
          },
          edges: [
            {
              cursor: categories[0]?.id,
              node: categories[0],
            },
            {
              cursor: categories[1]?.id,
              node: categories[1],
            },
            {
              cursor: categories[2]?.id,
              node: categories[2],
            },
          ],
        })
      })

      it("should work in forward direction, middle page", async () => {
        const result = S.encodeSync(PaginationResponse(Category))(
          await listCategories({
            search_query: "",
            direction: "forward",
            count: 3,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            target: categories[1]!.id,
          }),
        )

        expect(result).toEqual({
          page_info: {
            total_count: 7,
            start_cursor: categories[2]?.id,
            end_cursor: categories[4]?.id,
            has_previous_page: true,
            has_next_page: true,
          },
          edges: [
            {
              cursor: categories[2]?.id,
              node: categories[2],
            },
            {
              cursor: categories[3]?.id,
              node: categories[3],
            },
            {
              cursor: categories[4]?.id,
              node: categories[4],
            },
          ],
        })
      })

      it("should work in forward direction, last page", async () => {
        const result = S.encodeSync(PaginationResponse(Category))(
          await listCategories({
            search_query: "",
            direction: "forward",
            count: 3,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            target: categories[3]!.id,
          }),
        )

        expect(result).toEqual({
          page_info: {
            total_count: 7,
            start_cursor: categories[4]?.id,
            end_cursor: categories[6]?.id,
            has_previous_page: true,
            has_next_page: false,
          },
          edges: [
            {
              cursor: categories[4]?.id,
              node: categories[4],
            },
            {
              cursor: categories[5]?.id,
              node: categories[5],
            },
            {
              cursor: categories[6]?.id,
              node: categories[6],
            },
          ],
        })
      })

      it("should work in backward direction, first page", async () => {
        const result = S.encodeSync(PaginationResponse(Category))(
          await listCategories({
            search_query: "",
            direction: "backward",
            count: 3,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            target: categories[3]!.id,
          }),
        )

        expect(result).toEqual({
          page_info: {
            total_count: 7,
            start_cursor: categories[0]?.id,
            end_cursor: categories[2]?.id,
            has_previous_page: false,
            has_next_page: true,
          },
          edges: [
            {
              cursor: categories[0]?.id,
              node: categories[0],
            },
            {
              cursor: categories[1]?.id,
              node: categories[1],
            },
            {
              cursor: categories[2]?.id,
              node: categories[2],
            },
          ],
        })
      })

      it("should work in backward direction, middle page", async () => {
        const result = S.encodeSync(PaginationResponse(Category))(
          await listCategories({
            search_query: "",
            direction: "backward",
            count: 3,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            target: categories[5]!.id,
          }),
        )

        expect(result).toEqual({
          page_info: {
            total_count: 7,
            start_cursor: categories[2]?.id,
            end_cursor: categories[4]?.id,
            has_previous_page: true,
            has_next_page: true,
          },
          edges: [
            {
              cursor: categories[2]?.id,
              node: categories[2],
            },
            {
              cursor: categories[3]?.id,
              node: categories[3],
            },
            {
              cursor: categories[4]?.id,
              node: categories[4],
            },
          ],
        })
      })

      it("should work in backward direction, last page", async () => {
        const result = S.encodeSync(PaginationResponse(Category))(
          await listCategories({
            search_query: "",
            direction: "backward",
            count: 3,
          }),
        )

        expect(result).toEqual({
          page_info: {
            total_count: 7,
            start_cursor: categories[4]?.id,
            end_cursor: categories[6]?.id,
            has_previous_page: true,
            has_next_page: false,
          },
          edges: [
            {
              cursor: categories[4]?.id,
              node: categories[4],
            },
            {
              cursor: categories[5]?.id,
              node: categories[5],
            },
            {
              cursor: categories[6]?.id,
              node: categories[6],
            },
          ],
        })
      })

      it("should filter meta categories if needed", async () => {
        const result = S.encodeSync(PaginationResponse(Category))(
          await listCategories({
            search_query: "",
            direction: "forward",
            count: 10,
            is_meta: true,
          }),
        )

        expect(result).toEqual({
          page_info: {
            total_count: 3,
            start_cursor: categories[0]?.id,
            end_cursor: categories[2]?.id,
            has_previous_page: false,
            has_next_page: false,
          },
          edges: [
            {
              cursor: categories[0]?.id,
              node: categories[0],
            },
            {
              cursor: categories[1]?.id,
              node: categories[1],
            },
            {
              cursor: categories[2]?.id,
              node: categories[2],
            },
          ],
        })
      })
    })
  })
})
