import { TestDataSource } from "../TestDataSource"
import { Source } from "../adapters/Source"
import { Transaction } from "./Transaction"
import fs from "fs"
import path from "path"

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

  it("should interpret CSV files with bank data", async () => {
    const fileContent = fs.readFileSync(
      path.join(__dirname, "../mockData/bank.csv"),
      "utf8",
    )

    const result = await Transaction.importFile(fileContent, Source.BANK)
    expect(result.errors).toEqual([])
  })

  it("should interpret CSV files with PayPal data", async () => {
    const fileContent = fs.readFileSync(
      path.join(__dirname, "../mockData/paypal.csv"),
      "utf8",
    )

    const result = await Transaction.importFile(fileContent, Source.PAYPAL)
    expect(result.errors).toEqual([])
  })
})
