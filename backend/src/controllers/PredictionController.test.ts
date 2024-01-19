import { TestDataSource } from "../TestDataSource"
import { Category } from "../models/Category"
import { Prediction } from "../models/Prediction"
import {
  PredictionBulkCreationBody,
  PredictionBulkUpdateBody,
  PredictionController,
} from "./PredictionController"

describe("PredictionController", () => {
  const controller = new PredictionController()

  beforeAll(async () => {
    await TestDataSource.initialize()
  })

  afterAll(async () => {
    await TestDataSource.destroy()
  })

  it("should be able to create in bulk", async () => {
    const category = await Category.create({
      name: "Prediction bulk creation test category",
    }).save()

    const body: PredictionBulkCreationBody = new PredictionBulkCreationBody([
      {
        year: 2023,
        categoryId: category.id,
        value: 42,
      },
      {
        year: 2023,
        value: 84,
      },
    ])

    const result = await controller.createInBulk(body)

    expect(result.length).toBe(2)
    expect(result[0]?.value).toBe(42)
    expect(result[0]?.category?.id).toBe(category.id)
    expect(result[1]?.value).toBe(84)
    expect(result[1]?.category).toBe(null)
  })

  it("should be able to update in bulk", async () => {
    await Prediction.delete({})

    const category = await Category.create({
      name: "Prediction bulk update test category",
    }).save()

    const predictions = await controller.createInBulk(
      new PredictionBulkCreationBody([
        {
          year: 2023,
          categoryId: category.id,
          value: 42,
        },
        {
          year: 2023,
          value: 84,
        },
      ]),
    )

    const body = new PredictionBulkUpdateBody(
      predictions.map((prediction) => ({
        ...prediction,
        categoryId: prediction.category?.id,
        value: prediction.value / 2,
      })),
    )

    const result = await controller.updateInBulk(body)

    expect(result.length).toBe(2)
    expect(result[0]?.value).toBe(21)
    expect(result[0]?.category?.id).toBe(category.id)
    expect(result[1]?.value).toBe(42)
    expect(result[1]?.category).toBe(null)

    const allPredictionsCount = await Prediction.count()
    expect(allPredictionsCount).toBe(2)
  })
})
