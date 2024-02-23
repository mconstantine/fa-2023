import * as S from "@effect/schema/Schema"
import * as db from "../db"
import { insertTransaction } from "../functions/transaction/insert_transaction"
import {
  InsertTransactionInput,
  Transaction,
  UpdateTransactionInput,
  type TransactionWithCategories,
} from "../functions/transaction/domain"
import { insertTransactions } from "../functions/transaction/insert_transactions"
import { updateTransaction } from "../functions/transaction/update_transaction"
import { updateTransactions } from "../functions/transaction/update_transactions"
import { deleteTransaction } from "../functions/transaction/delete_transaction"
import { insertCategory } from "../functions/category/insert_category"
import { type Category } from "../functions/category/domain"
import { listTransactions } from "../functions/transaction/list_transactions"
import { aggregateTransactionsByCategory } from "../functions/transaction/aggregate_transactions_by_category"

/* eslint-disable @typescript-eslint/no-non-null-assertion */

describe("database transaction functions", () => {
  let categories: Category[]

  beforeAll(async () => {
    categories = await Promise.all([
      await insertCategory({
        name: "Transaction tests category 1",
        is_meta: false,
        keywords: [],
      }),
      await insertCategory({
        name: "Transaction tests category 2",
        is_meta: false,
        keywords: [],
      }),
    ])
  })

  afterAll(async () => {
    await db.query("delete from transaction")
    await db.query("delete from category")
  })

  describe("insert transaction", () => {
    it("should work and convert the value", async () => {
      const result = await insertTransaction(
        S.decodeSync(InsertTransactionInput)({
          description: "Insert transaction test",
          value: 1.5,
          date: "2020-01-01",
          categories_ids: [],
        }),
      )

      expect(S.is(S.UUID)(result.id)).toBe(true)
      expect(S.is(Transaction)(result)).toBe(true)
      expect(result.value).toBe(1.5)

      const rawResult = await db.query(
        "select * from transaction where id = $1",
        [result.id],
      )

      expect(rawResult.rows[0].value).toBe(150)
    })

    it("should add categories", async () => {
      const result = await insertTransaction({
        description: "Insert transaction with categories test",
        value: 1300,
        date: new Date(2020, 0, 1),
        categories_ids: categories.map((category) => category.id),
      })

      expect(result.categories).toEqual(categories)
    })
  })

  describe("bulk transactions insertion", () => {
    it("should work and convert the values", async () => {
      const result = await insertTransactions([
        {
          description: "Bulk transactions insertion test 1",
          value: 150,
          date: new Date(2020, 0, 1),
          categories_ids: [],
        },
        {
          description: "Bulk transactions insertion test 2",
          value: 300,
          date: new Date(2020, 0, 2),
          categories_ids: [],
        },
      ])

      expect(result.length).toBe(2)
      expect(S.is(S.UUID)(result[0]?.id)).toBe(true)
      expect(S.is(S.UUID)(result[1]?.id)).toBe(true)
      expect(result[0]?.value).toBe(1.5)
      expect(result[1]?.value).toBe(3)

      const rawResult = await db.query(
        `select * from transaction where id in (${result
          .map((_, i) => `$${i + 1}`)
          .join(", ")})`,
        result.map((t) => t.id),
      )

      expect(rawResult.rows[0].value).toBe(150)
      expect(rawResult.rows[1].value).toBe(300)
    })

    it("should add categories", async () => {
      const result = await insertTransactions([
        {
          description: "Bulk transactions insertion with categories test 1",
          value: 150,
          date: new Date(2020, 0, 1),
          categories_ids: [categories[0]!.id],
        },
        {
          description: "Bulk transactions insertion with categories test 2",
          value: 300,
          date: new Date(2020, 0, 2),
          categories_ids: [categories[1]!.id],
        },
      ])

      expect(result[0]?.categories).toEqual([categories[0]])
      expect(result[1]?.categories).toEqual([categories[1]])
    })
  })

  describe("update transaction", () => {
    it("should work and convert the value", async () => {
      const transaction = await insertTransaction({
        description: "Update transaction test",
        value: 420,
        date: new Date(2020, 0, 1),
        categories_ids: [],
      })

      const result = await updateTransaction(
        transaction.id,
        S.decodeSync(UpdateTransactionInput)({
          description: "Updated transaction test",
          value: 8.4,
          date: "2020-01-12",
        }),
      )

      expect(result.id).toEqual(transaction.id)
      expect(result.description).toBe("Updated transaction test")
      expect(result.value).toBe(8.4)
      expect(result.date).toEqual(new Date(2020, 0, 12))

      const rawResult = await db.query(
        "select * from transaction where id = $1",
        [result.id],
      )

      expect(rawResult.rows[0].value).toBe(840)
    })

    it("should update categories", async () => {
      const transaction = await insertTransaction({
        description: "Update transaction with categories test",
        value: 420,
        date: new Date(2020, 0, 1),
        categories_ids: [categories[0]!.id],
      })

      const result = await updateTransaction(transaction.id, {
        categories_ids: [categories[1]!.id],
      })

      expect(result.categories).toEqual([categories[1]])
    })

    it("should work with an empty update", async () => {
      const transaction = await insertTransaction({
        description: "Update transaction test",
        value: 420,
        date: new Date(2020, 0, 1),
        categories_ids: [],
      })

      const result = await updateTransaction(transaction.id, {})

      expect(result.id).toEqual(transaction.id)
      expect(result.description).toBe(transaction.description)
      expect(result.value).toBe(transaction.value)
      expect(result.date).toEqual(transaction.date)
    })
  })

  describe("bulk transactions update", () => {
    it("should work and convert the values", async () => {
      const transactions = await insertTransactions([
        {
          description: "Bulk transactions update test 1",
          value: 150,
          date: new Date(2020, 0, 1),
          categories_ids: [],
        },
        {
          description: "Bulk transactions update test 2",
          value: 300,
          date: new Date(2020, 0, 2),
          categories_ids: [],
        },
      ])

      const result = await updateTransactions({
        ids: transactions.map((t) => t.id),
        description: "Bulk updated transaction test",
        value: 420,
        date: new Date(2020, 1, 1),
      })

      expect(result.length).toBe(2)
      expect(result[0]?.id).toEqual(transactions[0]?.id)
      expect(result[1]?.id).toEqual(transactions[1]?.id)

      expect(result[0]?.description).toEqual("Bulk updated transaction test")
      expect(result[1]?.description).toEqual("Bulk updated transaction test")
      expect(result[0]?.value).toBe(4.2)
      expect(result[1]?.value).toBe(4.2)
      expect(result[0]?.date).toEqual(new Date(2020, 1, 1))
      expect(result[1]?.date).toEqual(new Date(2020, 1, 1))

      const rawResult = await db.query(
        `select * from transaction where id in (${result
          .map((_, i) => `$${i + 1}`)
          .join(", ")})`,
        transactions.map((t) => t.id),
      )

      expect(rawResult.rows[0].value).toBe(420)
      expect(rawResult.rows[1].value).toBe(420)
    })

    it("should replace categories", async () => {
      const transactions = await insertTransactions([
        {
          description: "Bulk transactions update replace categories test 1",
          value: 150,
          date: new Date(2020, 0, 1),
          categories_ids: [categories[0]!.id],
        },
        {
          description: "Bulk transactions update replace categories test 2",
          value: 300,
          date: new Date(2020, 0, 2),
          categories_ids: [categories[0]!.id],
        },
      ])

      const result = await updateTransactions({
        ids: transactions.map((t) => t.id),
        categories_mode: "replace",
        categories_ids: [categories[1]!.id],
      })

      expect(result[0]?.categories).toEqual([categories[1]])
      expect(result[1]?.categories).toEqual([categories[1]])
    })

    it("should add categories", async () => {
      const transactions = await insertTransactions([
        {
          description: "Bulk transactions update add categories test 1",
          value: 150,
          date: new Date(2020, 0, 1),
          categories_ids: [categories[0]!.id],
        },
        {
          description: "Bulk transactions update add categories test 2",
          value: 300,
          date: new Date(2020, 0, 2),
          categories_ids: [categories[0]!.id],
        },
      ])

      const result = await updateTransactions({
        ids: transactions.map((t) => t.id),
        categories_mode: "add",
        categories_ids: [categories[1]!.id],
      })

      expect(result[0]?.categories).toEqual(categories)
      expect(result[1]?.categories).toEqual(categories)
    })

    it("should work with an empty update", async () => {
      const transactions = await insertTransactions([
        {
          description: "Bulk transactions update test 1",
          value: 150,
          date: new Date(2020, 0, 1),
          categories_ids: [],
        },
        {
          description: "Bulk transactions update test 2",
          value: 300,
          date: new Date(2020, 0, 2),
          categories_ids: [],
        },
      ])

      const result = await updateTransactions({
        ids: transactions.map((t) => t.id),
      })

      expect(result.length).toBe(2)
      expect(result[0]?.id).toEqual(transactions[0]?.id)
      expect(result[1]?.id).toEqual(transactions[1]?.id)

      expect(result[0]?.description).toEqual(transactions[0]?.description)
      expect(result[1]?.description).toEqual(transactions[1]?.description)
      expect(result[0]?.value).toBe(transactions[0]?.value)
      expect(result[1]?.value).toBe(transactions[1]?.value)
      expect(result[0]?.date).toEqual(transactions[0]?.date)
      expect(result[1]?.date).toEqual(transactions[1]?.date)
    })
  })

  describe("delete transaction", () => {
    it("should work", async () => {
      const transaction = await insertTransaction({
        description: "Delete transaction test",
        value: 42,
        date: new Date(2020, 0, 1),
        categories_ids: [],
      })

      const result = await deleteTransaction(transaction.id)

      expect(result.id).toBe(transaction.id)

      await expect(async () => {
        await db.getOne(
          Transaction,
          "select * from transaction where id = $1",
          [transaction.id],
        )
      }).rejects.toBeTruthy()
    })

    it("should cascade on categories", async () => {
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

      await deleteTransaction(transaction.id)

      const relationshipAfter = await db.getMany(
        TransactionsCategories,
        "select * from transactions_categories where transaction_id = $1",
        [transaction.id],
      )

      expect(relationshipAfter.length).toBe(0)
    })
  })

  describe("list transactions", () => {
    beforeAll(async () => {
      await db.query("delete from transaction")
    })

    describe("with empty table", () => {
      it("should work", async () => {
        const result = await listTransactions({
          direction: "forward",
          count: 10,
          subject: "description",
          search_query: "",
          categories: "all",
          date_since: new Date(2020, 0, 1),
          date_until: new Date(2020, 11, 31),
        })

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
      let transactions: readonly TransactionWithCategories[]

      beforeAll(async () => {
        transactions = await insertTransactions([
          {
            description: "AX",
            value: -10000,
            date: new Date(2020, 3, 1),
            categories_ids: categories.map((c) => c.id),
          },
          {
            description: "BX",
            value: -6666,
            date: new Date(2020, 2, 15),
            categories_ids: [categories[0]!.id],
          },
          {
            description: "CX",
            value: -3333,
            date: new Date(2020, 2, 1),
            categories_ids: [categories[1]!.id],
          },
          {
            description: "DX",
            value: 0,
            date: new Date(2020, 1, 15),
            categories_ids: [],
          },
          {
            description: "EX",
            value: 3333,
            date: new Date(2020, 1, 1),
            categories_ids: [categories[1]!.id],
          },
          {
            description: "FX",
            value: 6666,
            date: new Date(2020, 0, 15),
            categories_ids: [categories[0]!.id],
          },
          {
            description: "G",
            value: 10000,
            date: new Date(2020, 0, 1),
            categories_ids: categories.map((c) => c.id),
          },
        ])
      })

      describe("pagination", () => {
        it("should work", async () => {
          const result = await listTransactions({
            direction: "forward",
            count: 10,
            subject: "description",
            search_query: "",
            categories: "all",
            date_since: new Date(2020, 0, 1),
            date_until: new Date(2020, 11, 31),
          })

          expect(result).toEqual({
            page_info: {
              total_count: 7,
              start_cursor: transactions[0]?.id,
              end_cursor: transactions[6]?.id,
              has_previous_page: false,
              has_next_page: false,
            },
            edges: transactions.map((t) => ({
              cursor: t.id,
              node: t,
            })),
          })
        })

        it("should work in forward direction, first page", async () => {
          const result = await listTransactions({
            direction: "forward",
            count: 3,
            subject: "description",
            search_query: "",
            categories: "all",
            date_since: new Date(2020, 0, 1),
            date_until: new Date(2020, 11, 31),
          })

          expect(result).toEqual({
            page_info: {
              total_count: 7,
              start_cursor: transactions[0]?.id,
              end_cursor: transactions[2]?.id,
              has_previous_page: false,
              has_next_page: true,
            },
            edges: transactions.slice(0, 3).map((t) => ({
              cursor: t.id,
              node: t,
            })),
          })
        })

        it("should work in forward direction, middle page", async () => {
          const result = await listTransactions({
            direction: "forward",
            count: 3,
            target: transactions[1]?.id,
            subject: "description",
            search_query: "",
            categories: "all",
            date_since: new Date(2020, 0, 1),
            date_until: new Date(2020, 11, 31),
          })

          expect(result).toEqual({
            page_info: {
              total_count: 7,
              start_cursor: transactions[2]?.id,
              end_cursor: transactions[4]?.id,
              has_previous_page: true,
              has_next_page: true,
            },
            edges: transactions.slice(2, 5).map((t) => ({
              cursor: t.id,
              node: t,
            })),
          })
        })

        it("should work in forward direction, last page", async () => {
          const result = await listTransactions({
            direction: "forward",
            count: 3,
            target: transactions[3]?.id,
            subject: "description",
            search_query: "",
            categories: "all",
            date_since: new Date(2020, 0, 1),
            date_until: new Date(2020, 11, 31),
          })

          expect(result).toEqual({
            page_info: {
              total_count: 7,
              start_cursor: transactions[4]?.id,
              end_cursor: transactions[6]?.id,
              has_previous_page: true,
              has_next_page: false,
            },
            edges: transactions.slice(4).map((t) => ({
              cursor: t.id,
              node: t,
            })),
          })
        })

        it("should work in backward direction, first page", async () => {
          const result = await listTransactions({
            direction: "backward",
            count: 3,
            target: transactions[3]?.id,
            subject: "description",
            search_query: "",
            categories: "all",
            date_since: new Date(2020, 0, 1),
            date_until: new Date(2020, 11, 31),
          })

          expect(result).toEqual({
            page_info: {
              total_count: 7,
              start_cursor: transactions[0]?.id,
              end_cursor: transactions[2]?.id,
              has_previous_page: false,
              has_next_page: true,
            },
            edges: transactions.slice(0, 3).map((t) => ({
              cursor: t.id,
              node: t,
            })),
          })
        })

        it("should work in backward direction, middle page", async () => {
          const result = await listTransactions({
            direction: "backward",
            count: 3,
            target: transactions[5]?.id,
            subject: "description",
            search_query: "",
            categories: "all",
            date_since: new Date(2020, 0, 1),
            date_until: new Date(2020, 11, 31),
          })

          expect(result).toEqual({
            page_info: {
              total_count: 7,
              start_cursor: transactions[2]?.id,
              end_cursor: transactions[4]?.id,
              has_previous_page: true,
              has_next_page: true,
            },
            edges: transactions.slice(2, 5).map((t) => ({
              cursor: t.id,
              node: t,
            })),
          })
        })

        it("should work in backward direction, last page", async () => {
          const result = await listTransactions({
            direction: "backward",
            count: 3,
            subject: "description",
            search_query: "",
            categories: "all",
            date_since: new Date(2020, 0, 1),
            date_until: new Date(2020, 11, 31),
          })

          expect(result).toEqual({
            page_info: {
              total_count: 7,
              start_cursor: transactions[4]?.id,
              end_cursor: transactions[6]?.id,
              has_previous_page: true,
              has_next_page: false,
            },
            edges: transactions.slice(4).map((t) => ({
              cursor: t.id,
              node: t,
            })),
          })
        })
      })

      describe("filters", () => {
        describe("subject", () => {
          it("should search in description", async () => {
            const result = await listTransactions({
              direction: "forward",
              count: 10,
              subject: "description",
              search_query: "x",
              categories: "all",
              date_since: new Date(2020, 0, 1),
              date_until: new Date(2020, 11, 31),
            })

            expect(result).toEqual({
              page_info: {
                total_count: 6,
                start_cursor: transactions[0]?.id,
                end_cursor: transactions[5]?.id,
                has_previous_page: false,
                has_next_page: false,
              },
              edges: transactions.slice(0, 6).map((t) => ({
                cursor: t.id,
                node: t,
              })),
            })
          })

          it("should find by value", async () => {
            const result = await listTransactions({
              direction: "forward",
              count: 10,
              subject: "value",
              min: -10050,
              max: 0,
              categories: "all",
              date_since: new Date(2020, 0, 1),
              date_until: new Date(2020, 11, 31),
            })

            expect(result).toEqual({
              page_info: {
                total_count: 4,
                start_cursor: transactions[0]?.id,
                end_cursor: transactions[3]?.id,
                has_previous_page: false,
                has_next_page: false,
              },
              edges: transactions.slice(0, 4).map((t) => ({
                cursor: t.id,
                node: t,
              })),
            })
          })

          it("should handle min greater than max", async () => {
            const result = await listTransactions({
              direction: "forward",
              count: 10,
              subject: "value",
              min: 0,
              max: -10050,
              categories: "all",
              date_since: new Date(2020, 0, 1),
              date_until: new Date(2020, 11, 31),
            })

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

        describe("categories", () => {
          it("should find uncategorized only", async () => {
            const result = await listTransactions({
              direction: "forward",
              count: 10,
              subject: "description",
              search_query: "",
              categories: "uncategorized",
              date_since: new Date(2020, 0, 1),
              date_until: new Date(2020, 11, 31),
            })

            expect(result).toEqual({
              page_info: {
                total_count: 1,
                start_cursor: transactions[3]?.id,
                end_cursor: transactions[3]?.id,
                has_previous_page: false,
                has_next_page: false,
              },
              edges: [transactions[3]].map((t) => ({
                cursor: t?.id,
                node: t,
              })),
            })
          })

          it("should find by specific categories", async () => {
            const result = await listTransactions({
              direction: "forward",
              count: 10,
              subject: "description",
              search_query: "",
              categories: "specific",
              categories_ids: [categories[0]!.id],
              date_since: new Date(2020, 0, 1),
              date_until: new Date(2020, 11, 31),
            })

            expect(result).toEqual({
              page_info: {
                total_count: 4,
                start_cursor: transactions[0]?.id,
                end_cursor: transactions[6]?.id,
                has_previous_page: false,
                has_next_page: false,
              },
              edges: [
                transactions[0],
                transactions[1],
                transactions[5],
                transactions[6],
              ].map((t) => ({
                cursor: t?.id,
                node: t,
              })),
            })
          })
        })

        describe("date range", () => {
          it("should find by date range", async () => {
            const result = await listTransactions({
              direction: "forward",
              count: 10,
              subject: "description",
              search_query: "",
              categories: "all",
              date_since: new Date(2020, 2, 1),
              date_until: new Date(2020, 3, 1),
            })

            expect(result).toEqual({
              page_info: {
                total_count: 3,
                start_cursor: transactions[0]?.id,
                end_cursor: transactions[2]?.id,
                has_previous_page: false,
                has_next_page: false,
              },
              edges: transactions.slice(0, 3).map((t) => ({
                cursor: t?.id,
                node: t,
              })),
            })
          })

          it("should handle inverse date ranges", async () => {
            const result = await listTransactions({
              direction: "forward",
              count: 10,
              subject: "description",
              search_query: "",
              categories: "all",
              date_since: new Date(2020, 3, 1),
              date_until: new Date(2020, 2, 1),
            })

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
      })
    })
  })

  describe("aggregate transactions by category", () => {
    beforeAll(async () => {
      await db.query("delete from transaction")
    })

    it("should work and order by category name", async () => {
      await insertTransactions([
        {
          description: "Aggregate transactions by category test 1",
          value: 200,
          date: new Date(2020, 0, 1),
          categories_ids: [categories[0]!.id],
        },
        {
          description: "Aggregate transactions by category test 2",
          value: 300,
          date: new Date(2020, 11, 31),
          categories_ids: [categories[1]!.id],
        },
        {
          description: "Aggregate transactions by category test 3",
          value: 450,
          date: new Date(2020, 0, 1),
          categories_ids: [categories[0]!.id, categories[1]!.id],
        },
        {
          description: "Aggregate transactions by category test 4",
          value: 500,
          date: new Date(2020, 0, 1),
          categories_ids: [],
        },
        {
          description: "Aggregate transactions by category test 4",
          value: 1000,
          date: new Date(2021, 0, 1),
          categories_ids: [categories[0]!.id, categories[1]!.id],
        },
      ])

      const result = await aggregateTransactionsByCategory({
        year: 2020,
      })

      expect(result).toEqual([
        {
          category_id: categories[0]?.id,
          category_name: categories[0]?.name,
          transactions_total: 6.5,
        },
        {
          category_id: categories[1]?.id,
          category_name: categories[1]?.name,
          transactions_total: 7.5,
        },
        {
          category_id: null,
          category_name: null,
          transactions_total: 5,
        },
      ])
    })
  })
})
