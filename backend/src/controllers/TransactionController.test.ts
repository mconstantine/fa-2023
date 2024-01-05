import { TransactionController } from "./TransactionController"
import { TestDataSource } from "../TestDataSource"
import { Transaction } from "../models/Transaction"

describe("TransactionController", () => {
  beforeAll(async () => {
    await TestDataSource.initialize()
  })

  afterAll(async () => {
    await TestDataSource.destroy()
  })

  it("should be able to merge bank and PayPal transactions", () => {
    const bankTransactions = [
      Transaction.create({
        date: new Date(2020, 0, 1),
        description: "Not a transaction to be merged",
        value: -4.2,
      }),
      Transaction.create({
        date: new Date(2020, 4, 12),
        description: "PayPal same date different value",
        value: -69.69,
      }),
      Transaction.create({
        date: new Date(2020, 4, 16),
        description: "PayPal different date same value",
        value: -42.42,
      }),
      Transaction.create({
        date: new Date(2020, 4, 12),
        description: "PayPal same date different value",
        value: -42.42,
      }),
    ]

    const paypalTransactions = [
      Transaction.create({
        date: new Date(2020, 4, 14),
        description: "Different date same value",
        value: -42.42,
      }),
      Transaction.create({
        date: new Date(2020, 4, 10),
        description: "Same date different value 1",
        value: -69.69,
      }),
      Transaction.create({
        date: new Date(2020, 4, 10),
        description: "Same date different value 2",
        value: -42.42,
      }),
    ]

    const result = TransactionController.mergeBankAndPayPalTransactions(
      bankTransactions,
      paypalTransactions,
    )

    expect(result).toEqual([
      Transaction.create({
        date: new Date(2020, 0, 1),
        description: "Not a transaction to be merged",
        value: -4.2,
      }),
      Transaction.create({
        date: new Date(2020, 4, 10),
        description: "Same date different value 1",
        value: -69.69,
      }),
      Transaction.create({
        date: new Date(2020, 4, 10),
        description: "Same date different value 2",
        value: -42.42,
      }),
      Transaction.create({
        date: new Date(2020, 4, 14),
        description: "Different date same value",
        value: -42.42,
      }),
    ])
  })
})
