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
        name: "Category creation test minimal data",
      }).save()

      assert.strictEqual(category.name, "Category creation test minimal data")
      assert.deepStrictEqual(category.keywords, [])
    })

    it("should work with empty array of keywords", async () => {
      const category = await Category.create({
        name: "Category creation test empty array",
        keywords: [],
      }).save()

      assert.deepStrictEqual(category.keywords, [])
    })

    it("should work with keywords", async () => {
      const category = await Category.create({
        name: "Category creation test with keywords",
        keywords: ["some", "keywords"],
      }).save()

      assert.deepStrictEqual(category.keywords, ["some", "keywords"])
    })
  })
})
