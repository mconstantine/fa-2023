import * as S from "@effect/schema/Schema"
import { insertCategory } from "../functions/category/insert_category"
import * as db from "../db"

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
    })

    it.todo("should work with empty keywords array")
    it.todo("should work with no keywords array")
  })
})
