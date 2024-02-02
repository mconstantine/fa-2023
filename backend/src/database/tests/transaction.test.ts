import * as S from "@effect/schema/Schema"
import * as db from "../db"
import { insertTransaction } from "../functions/transaction/insert_transaction"
import { Transaction } from "../functions/transaction/domain"
import { insertTransactions } from "../functions/transaction/insert_transactions"

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
    it("should work", async () => {
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
})
