import { describe, it } from "node:test"
import { BankEntry } from "../models/BankEntry"
import { computeTotals } from "./computeTotals"
import assert from "node:assert"

describe("computeTotals", () => {
  it("should work", () => {
    const bankEntries: BankEntry[] = [
      BankEntry.fromCSV(["01/01/2020", "Whatever reason", "10.00"]),
      BankEntry.fromCSV(["01/01/2020", "Whatever reason", "-5.50"]),
    ]

    const totals = computeTotals(bankEntries)

    assert.strictEqual(totals.income, 10)
    assert.strictEqual(totals.outcome, 5.5)
    assert.strictEqual(totals.total, 4.5)
  })
})
