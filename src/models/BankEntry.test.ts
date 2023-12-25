import { describe, it } from "node:test"
import { BankEntry } from "./BankEntry"
import assert from "node:assert"

describe("BankEntry", () => {
  it("should build an object from a truple", () => {
    const entity = BankEntry.fromCSV(["01/01/2020", "Some reason", "-42,69"])

    assert.strictEqual(entity.date.toISOString(), "2020-01-01T00:00:00.000Z")
    assert.strictEqual(entity.reason, "Some reason")
    assert.strictEqual(entity.value, -42.69)
  })
})
