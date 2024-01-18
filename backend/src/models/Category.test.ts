import { TestDataSource } from "../TestDataSource"
import { Category } from "./Category"

describe("Category", () => {
  beforeAll(async () => {
    await TestDataSource.initialize()
  })

  afterAll(async () => {
    await TestDataSource.destroy()
  })

  describe("creation", () => {
    it("should work with minimal data", async () => {
      const category = await Category.create({
        name: "Category creation test minimal data",
      }).save()

      expect(category.name).toBe("Category creation test minimal data")
      expect(category.keywords).toEqual([])
      expect(category.isMeta).toBe(false)
    })

    it("should work with empty array of keywords", async () => {
      const category = await Category.create({
        name: "Category creation test empty array",
        keywords: [],
      }).save()

      expect(category.keywords).toEqual([])
    })

    it("should work with keywords", async () => {
      const category = await Category.create({
        name: "Category creation test with keywords",
        keywords: ["some", "keywords"],
      }).save()

      expect(category.keywords).toEqual(["some", "keywords"])
    })
  })
})
