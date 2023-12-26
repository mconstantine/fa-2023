import { before, describe, it } from "node:test"
import { Category } from "./Category"
import assert from "node:assert"
import { TestDataSource } from "../TestDataSource"

describe("Category", () => {
  before(async () => {
    await TestDataSource.initialize()
  })

  describe("creation", () => {
    it("should work with minimal data", async () => {
      const category = await Category.create({
        name: "Category creation test",
      }).save()

      assert.strictEqual(category.name, "Category creation test")
      assert.deepStrictEqual(category.keywords, [])
    })
  })
})
