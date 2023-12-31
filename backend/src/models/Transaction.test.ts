import { TestDataSource } from "../TestDataSource"
import { Transaction } from "./Transaction"

describe("Transaction", () => {
  beforeAll(async () => {
    await TestDataSource.initialize()
  })

  afterAll(async () => {
    await TestDataSource.destroy()
  })

  it("should save values as integers", async () => {
    const transaction = await Transaction.create({
      description: "Transaction creation test",
      value: 42.69,
    }).save()

    expect(transaction.value).toBe(42.69)

    const rawTransaction = await TestDataSource.createQueryBuilder()
      .from(Transaction, "t")
      .where({ id: transaction.id })
      .getRawOne()

    expect(rawTransaction.value).toBe(4269)
  })
})
