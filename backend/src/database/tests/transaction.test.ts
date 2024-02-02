import * as S from "@effect/schema/Schema"
import * as db from "../db"
import { insertTransaction } from "../functions/transaction/insert_transaction"
import { Transaction } from "../functions/transaction/domain"
import { insertTransactions } from "../functions/transaction/insert_transactions"
import { updateTransaction } from "../functions/transaction/update_transaction"
import { updateTransactions } from "../functions/transaction/update_transactions"

describe("database transaction functions", () => {
  afterAll(async () => {
    await db.query("delete from transaction")
  })

  describe("insert transaction", () => {
    it("should work and convert the value", async () => {
      const result = await insertTransaction({
        description: "Insert transaction test",
        value: 150,
        date: new Date(2020, 0, 1),
      })

      expect(S.is(S.UUID)(result.id)).toBe(true)
      expect(S.is(Transaction)(result)).toBe(true)
      expect(result.value).toBe(1.5)

      const rawResult = await db.query(
        "select * from transaction where id = $1",
        [result.id],
      )

      expect(rawResult.rows[0].value).toBe(150)
    })
  })

  describe("bulk transactions insertion", () => {
    it("should work and convert the values", async () => {
      const result = await insertTransactions([
        {
          description: "Bulk transactions insertion test 1",
          value: 150,
          date: new Date(2020, 0, 1),
        },
        {
          description: "Bulk transactions insertion test 2",
          value: 300,
          date: new Date(2020, 0, 2),
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
  })

  describe("update transaction", () => {
    it("should work and convert the value", async () => {
      const transaction = await insertTransaction({
        description: "Update transaction test",
        value: 420,
        date: new Date(2020, 0, 1),
      })

      const result = await updateTransaction(transaction.id, {
        description: "Updated transaction test",
        value: 840,
        date: new Date(2020, 0, 12),
      })

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

    it("should work with an empty update", async () => {
      const transaction = await insertTransaction({
        description: "Update transaction test",
        value: 420,
        date: new Date(2020, 0, 1),
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
        },
        {
          description: "Bulk transactions update test 2",
          value: 300,
          date: new Date(2020, 0, 2),
        },
      ])

      const result = await updateTransactions(
        transactions.map((t) => t.id),
        {
          description: "Bulk updated transaction test",
          value: 420,
          date: new Date(2020, 1, 1),
        },
      )

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

    it("should work with an empty update", async () => {
      const transactions = await insertTransactions([
        {
          description: "Bulk transactions update test 1",
          value: 150,
          date: new Date(2020, 0, 1),
        },
        {
          description: "Bulk transactions update test 2",
          value: 300,
          date: new Date(2020, 0, 2),
        },
      ])

      const result = await updateTransactions(
        transactions.map((t) => t.id),
        {},
      )

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
})
