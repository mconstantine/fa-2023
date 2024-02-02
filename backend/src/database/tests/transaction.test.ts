import * as S from "@effect/schema/Schema"
import * as db from "../db"
import { insertTransaction } from "../functions/transaction/insert_transaction"
import { Transaction } from "../functions/transaction/domain"

describe("database transaction functions", () => {
  afterAll(async () => {
    await db.query("delete from transaction")
  })

  describe("insert_transaction", () => {
    it("should work and convert the value", async () => {
      const result = await insertTransaction({
        description: "Insert transaction test",
        value: 1.5,
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
})
