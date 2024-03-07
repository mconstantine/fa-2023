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
import { aggregateTransactionsByMonth } from "../functions/transaction/aggregate_transactions_by_month"
import { aggregateTransactionsByTimeAndCategory } from "../functions/transaction/aggregate_transactions_by_time_and_category"
import { Either } from "effect"
import { type User } from "../functions/user/domain"
import { insertUser } from "../functions/user/insert_user"

/* eslint-disable @typescript-eslint/no-non-null-assertion */

describe("database transaction functions", () => {
  let user: User
  let culprit: User
  let categories: Category[]

  beforeAll(async () => {
    user = await insertUser({
      name: "Transaction Tests",
      email: "transaction.tests@example.com",
      password: "P4ssw0rd!",
    })

    culprit = await insertUser({
      name: "Transaction Tests Culprit",
      email: "transaction.tests.culprit@example.com",
      password: "P4ssw0rd!",
    })

    categories = await Promise.all([
      await insertCategory(user, {
        name: "Transaction tests category 1",
        is_meta: false,
        is_projectable: false,
        keywords: [],
      }),
      await insertCategory(user, {
        name: "Transaction tests category 2",
        is_meta: false,
        is_projectable: false,
        keywords: [],
      }),
    ])
  })

  afterAll(async () => {
    await db.query('delete from "user"')
  })

  describe("insert transaction", () => {
    it("should work and convert the value", async () => {
      const result = await insertTransaction(
        user,
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
      const result = await insertTransaction(user, {
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
      const result = await insertTransactions(user, [
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
      const result = await insertTransactions(user, [
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
    let transaction: TransactionWithCategories

    beforeEach(async () => {
      transaction = await insertTransaction(user, {
        description: "Update transaction test",
        value: 420,
        date: new Date(2020, 0, 1),
        categories_ids: [],
      })
    })

    it("should work and convert the value", async () => {
      const result = await updateTransaction(
        user,
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

    it("should not allow to update transactions of other users", async () => {
      await expect(
        async () => await updateTransaction(culprit, transaction.id, {}),
      ).rejects.toBeTruthy()
    })

    it("should update categories", async () => {
      const result = await updateTransaction(user, transaction.id, {
        categories_ids: [categories[1]!.id],
      })

      expect(result.categories).toEqual([categories[1]])
    })

    it("should work with an empty update", async () => {
      const result = await updateTransaction(user, transaction.id, {})

      expect(result.id).toEqual(transaction.id)
      expect(result.description).toBe(transaction.description)
      expect(result.value).toBe(transaction.value)
      expect(result.date).toEqual(transaction.date)
    })
  })

  describe("bulk transactions update", () => {
    let transactions: readonly TransactionWithCategories[]

    beforeEach(async () => {
      transactions = await insertTransactions(user, [
        {
          description: "Bulk transactions update test 1",
          value: 150,
          date: new Date(2020, 0, 1),
          categories_ids: [categories[0]!.id],
        },
        {
          description: "Bulk transactions update test 2",
          value: 300,
          date: new Date(2020, 0, 2),
          categories_ids: [categories[0]!.id],
        },
      ])
    })

    it("should work and convert the values", async () => {
      const result = await updateTransactions(user, {
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

    it("should not allow to update transactions of other users", async () => {
      await expect(
        async () =>
          await updateTransactions(culprit, {
            ids: transactions.map((t) => t.id),
          }),
      ).rejects.toBeTruthy()
    })

    it("should replace categories", async () => {
      const result = await updateTransactions(user, {
        ids: transactions.map((t) => t.id),
        categories_mode: "replace",
        categories_ids: [categories[1]!.id],
      })

      expect(result[0]?.categories).toEqual([categories[1]])
      expect(result[1]?.categories).toEqual([categories[1]])
    })

    it("should add categories", async () => {
      const result = await updateTransactions(user, {
        ids: transactions.map((t) => t.id),
        categories_mode: "add",
        categories_ids: [categories[1]!.id],
      })

      expect(result[0]?.categories).toEqual(categories)
      expect(result[1]?.categories).toEqual(categories)
    })

    it("should work with an empty update", async () => {
      const result = await updateTransactions(user, {
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
    let transaction: TransactionWithCategories

    beforeEach(async () => {
      transaction = await insertTransaction(user, {
        description: "Delete transaction test",
        value: 42,
        date: new Date(2020, 0, 1),
        categories_ids: [],
      })
    })

    it("should work", async () => {
      const result = await deleteTransaction(user, transaction.id)

      expect(result.id).toBe(transaction.id)

      const transactionAfterDeletion = await db.getOne(
        Transaction,
        "select * from transaction where id = $1",
        [transaction.id],
      )

      expect(Either.isLeft(transactionAfterDeletion)).toBe(true)
    })

    it("should not allow to delete transactions of other users", async () => {
      await expect(
        async () => await deleteTransaction(culprit, transaction.id),
      ).rejects.toBeTruthy()
    })

    it("should cascade on categories", async () => {
      const TransactionsCategories = S.struct({
        transaction_id: S.UUID,
        category_id: S.UUID,
      })

      const category = await insertCategory(user, {
        name: "Relationship with transactions test",
        is_meta: false,
        is_projectable: false,
        keywords: [],
      })

      const transaction = await insertTransaction(user, {
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

      expect(Either.getOrThrow(relationshipBefore).length).toBe(1)

      await deleteTransaction(user, transaction.id)

      const relationshipAfter = await db.getMany(
        TransactionsCategories,
        "select * from transactions_categories where transaction_id = $1",
        [transaction.id],
      )

      expect(Either.getOrThrow(relationshipAfter).length).toBe(0)
    })
  })

  describe("list transactions", () => {
    beforeAll(async () => {
      await db.query("delete from transaction")
    })

    describe("with empty table", () => {
      it("should work", async () => {
        const result = await listTransactions(user, {
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
        transactions = await insertTransactions(user, [
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

      it("should not allow to list transactions of other users", async () => {
        const result = await listTransactions(culprit, {
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

      describe("pagination", () => {
        it("should work", async () => {
          const result = await listTransactions(user, {
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
          const result = await listTransactions(user, {
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
          const result = await listTransactions(user, {
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
          const result = await listTransactions(user, {
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
          const result = await listTransactions(user, {
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
          const result = await listTransactions(user, {
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
          const result = await listTransactions(user, {
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
            const result = await listTransactions(user, {
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
            const result = await listTransactions(user, {
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
            const result = await listTransactions(user, {
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
            const result = await listTransactions(user, {
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
            const result = await listTransactions(user, {
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
            const result = await listTransactions(user, {
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
            const result = await listTransactions(user, {
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
    beforeEach(async () => {
      await db.query("delete from transaction")
    })

    describe("with no data", () => {
      it("should work", async () => {
        const result = await aggregateTransactionsByCategory(user, {
          year: 2020,
        })

        expect(result).toEqual([])
      })
    })

    describe("with data", () => {
      beforeEach(async () => {
        await insertTransactions(user, [
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
      })

      it("should work and order by category name", async () => {
        const result = await aggregateTransactionsByCategory(user, {
          year: 2020,
        })

        expect(result).toEqual([
          {
            category_id: categories[0]?.id,
            category_name: categories[0]?.name,
            category_is_projectable: categories[0]?.is_projectable,
            transactions_total: 6.5,
          },
          {
            category_id: categories[1]?.id,
            category_name: categories[1]?.name,
            category_is_projectable: categories[1]?.is_projectable,
            transactions_total: 7.5,
          },
          {
            category_id: null,
            category_name: null,
            category_is_projectable: null,
            transactions_total: 5,
          },
        ])
      })

      it("should allow access to transactions of other users", async () => {
        const result = await aggregateTransactionsByCategory(culprit, {
          year: 2020,
        })

        expect(result).toEqual([])
      })
    })
  })

  describe("aggregate transactions by month", () => {
    beforeAll(async () => {
      await db.query("delete from transaction")
    })

    describe("with no data", () => {
      it("should work", async () => {
        const result = await aggregateTransactionsByMonth(user, {
          year: 2020,
        })

        expect(result).toEqual([])
      })
    })

    describe("with data", () => {
      beforeEach(async () => {
        await insertTransactions(user, [
          {
            description: "Aggregate transactions by month test 1",
            value: 200,
            date: new Date(2020, 0, 1),
            categories_ids: [],
          },
          {
            description: "Aggregate transactions by month test 2",
            value: -300,
            date: new Date(2020, 11, 31),
            categories_ids: [],
          },
          {
            description: "Aggregate transactions by month test 3",
            value: -450,
            date: new Date(2020, 0, 1),
            categories_ids: [],
          },
          {
            description: "Aggregate transactions by month test 4",
            value: 500,
            date: new Date(2020, 1, 1),
            categories_ids: [],
          },
          {
            description: "Aggregate transactions by month test 4",
            value: 1000,
            date: new Date(2021, 0, 1),
            categories_ids: [],
          },
        ])
      })

      it("should work", async () => {
        const result = await aggregateTransactionsByMonth(user, {
          year: 2020,
        })

        expect(result).toEqual([
          {
            month: 1,
            income: 2,
            outcome: -4.5,
            total: -2.5,
          },
          {
            month: 2,
            income: 5,
            outcome: 0,
            total: 5,
          },
          {
            month: 12,
            income: 0,
            outcome: -3,
            total: -3,
          },
        ])
      })

      it("should not aggregated subcategories if not needed", async () => {
        const result = await aggregateTransactionsByMonth(culprit, {
          year: 2020,
        })

        expect(result).toEqual([])
      })
    })
  })

  describe("category-time aggregation", () => {
    let categories: readonly Category[]

    beforeAll(async () => {
      await db.query("delete from transaction")
    })

    describe("with no data", () => {
      it("should work", async () => {
        const result = await aggregateTransactionsByTimeAndCategory(user, {
          time_range: "monthly",
          year: 2020,
        })

        expect(result).toEqual({
          categories: [],
          time: [],
        })
      })
    })

    describe("with data", () => {
      beforeAll(async () => {
        categories = [
          await insertCategory(user, {
            name: "Category-time aggregation test root category",
            is_meta: false,
            is_projectable: false,
            keywords: [],
          }),
          await insertCategory(user, {
            name: "Category-time aggregation test category 1",
            is_meta: true,
            is_projectable: false,
            keywords: [],
          }),
          await insertCategory(user, {
            name: "Category-time aggregation test category 2",
            is_meta: true,
            is_projectable: false,
            keywords: [],
          }),
          await insertCategory(user, {
            name: "Category-time aggregation test category 3",
            is_meta: true,
            is_projectable: false,
            keywords: [],
          }),
        ]

        await insertTransactions(user, [
          {
            description: "Category-time aggregation test 1",
            date: new Date(2020, 0, 1),
            value: -2500,
            categories_ids: [
              categories[0]!.id,
              categories[1]!.id,
              categories[2]!.id,
            ],
          },
          {
            description: "Category-time aggregation test 2",
            date: new Date(2020, 0, 15),
            value: -2500,
            categories_ids: [
              categories[0]!.id,
              categories[1]!.id,
              categories[2]!.id,
            ],
          },
          {
            description: "Category-time aggregation test 3",
            date: new Date(2020, 5, 1),
            value: -2500,
            categories_ids: [
              categories[0]!.id,
              categories[1]!.id,
              categories[3]!.id,
            ],
          },
          {
            description: "Category-time aggregation test 4",
            date: new Date(2020, 5, 15),
            value: -2500,
            categories_ids: [],
          },
          {
            description: "Category-time aggregation test 5",
            date: new Date(2021, 0, 1),
            value: -2500,
            categories_ids: [],
          },
        ])
      })

      it("should not allow to access transactions of other users", async () => {
        const result = await aggregateTransactionsByTimeAndCategory(culprit, {
          time_range: "monthly",
          year: 2020,
        })

        expect(result).toEqual({
          categories: [],
          time: [],
        })
      })

      it("should allow to group monthly", async () => {
        const result = await aggregateTransactionsByTimeAndCategory(user, {
          time_range: "monthly",
          year: 2020,
        })

        expect(result.time).toEqual([
          {
            time: 1,
            total: -50,
          },
          {
            time: 6,
            total: -50,
          },
        ])
      })

      it("should allow to group weekly", async () => {
        const result = await aggregateTransactionsByTimeAndCategory(user, {
          time_range: "weekly",
          year: 2020,
        })

        expect(result.time).toEqual([
          {
            time: 1,
            total: -25,
          },
          {
            time: 3,
            total: -25,
          },
          {
            time: 23,
            total: -25,
          },
          {
            time: 25,
            total: -25,
          },
        ])
      })

      it("should allow to group daily", async () => {
        const result = await aggregateTransactionsByTimeAndCategory(user, {
          time_range: "daily",
          year: 2020,
          categories_ids: [],
        })

        expect(result.time).toEqual([
          {
            time: 1,
            total: -25,
          },
          {
            time: 15,
            total: -25,
          },
          {
            time: 153,
            total: -25,
          },
          {
            time: 167,
            total: -25,
          },
        ])
      })

      it("should aggregate subcategories", async () => {
        const result = await aggregateTransactionsByTimeAndCategory(user, {
          time_range: "monthly",
          year: 2020,
          categories_ids: [categories[0]!.id],
        })

        expect(result.time).toEqual([
          {
            time: 1,
            total: -50,
          },
          {
            time: 6,
            total: -25,
          },
        ])

        expect(result.categories).toEqual([
          {
            id: categories[0]!.id,
            name: categories[0]!.name,
            is_meta: false,
            min_transaction_value: -25,
            max_transaction_value: -25,
            total: -75,
          },
          {
            id: categories[1]!.id,
            name: categories[1]!.name,
            is_meta: true,
            min_transaction_value: -25,
            max_transaction_value: -25,
            total: -75,
          },
          {
            id: categories[2]!.id,
            name: categories[2]!.name,
            is_meta: true,
            min_transaction_value: -25,
            max_transaction_value: -25,
            total: -50,
          },
          {
            id: categories[3]!.id,
            name: categories[3]!.name,
            is_meta: true,
            min_transaction_value: -25,
            max_transaction_value: -25,
            total: -25,
          },
        ])
      })

      it("should not aggregated subcategories if not needed", async () => {
        const result = await aggregateTransactionsByTimeAndCategory(user, {
          time_range: "monthly",
          year: 2020,
          categories_ids: [],
        })

        expect(result.categories).toEqual([])
      })
    })
  })
})
