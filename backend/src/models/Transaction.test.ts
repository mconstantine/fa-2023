import { TestDataSource } from "../TestDataSource"
import { Transaction } from "./Transaction"

describe("Transaction", () => {
  beforeAll(async () => {
    await TestDataSource.initialize()
  })

  afterAll(async () => {
    await TestDataSource.destroy()
  })

  it("should correcly transform values", async () => {
    const transaction = await Transaction.create({
      description: "Transaction creation test",
      value: 42.69,
      date: new Date(2020, 0, 15),
    }).save()

    expect(transaction.value).toBe(42.69)
    expect(transaction.date.getTime()).toBe(1579046400000)

    const rawTransaction = await TestDataSource.createQueryBuilder()
      .from(Transaction, "t")
      .where({ id: transaction.id })
      .getRawOne()

    expect(rawTransaction.value).toBe(4269)
  })
})
