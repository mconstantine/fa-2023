import { Either, pipe } from "effect"
import { BankAdapter } from "./BankAdapter"

describe("BankAdapter", () => {
  describe("parsing a row", () => {
    it("should work for inbound money", () => {
      const row = "15/01/2020;16/01/2020;Inbound money test;42,50;;EUR"
      const result = pipe(BankAdapter.fromString(row), Either.getOrThrow)

      expect(result.description).toBe("Inbound money test")
      expect(result.value).toBe(4250)
      expect(result.date.toISOString()).toBe("2020-01-16T00:00:00.000Z")
    })

    it("should work for outbound money", () => {
      const row = "16/01/2020;17/01/2020;Outbound money test;;-42,50;EUR"
      const result = pipe(BankAdapter.fromString(row), Either.getOrThrow)

      expect(result.description).toBe("Outbound money test")
      expect(result.value).toBe(-4250)
      expect(result.date.toISOString()).toBe("2020-01-17T00:00:00.000Z")
    })

    it("should work with no accounting date", () => {
      const row = ";18/01/2020;No accounting date test;;-42,50;EUR"
      const result = pipe(BankAdapter.fromString(row), Either.getOrThrow)

      expect(result.description).toBe("No accounting date test")
      expect(result.value).toBe(-4250)
      expect(result.date.toISOString()).toBe("2020-01-18T00:00:00.000Z")
    })

    it("should work with thousands", () => {
      const row = "15/01/2020;16/01/2020;Thousands test;6.666,42;;EUR"
      const result = pipe(BankAdapter.fromString(row), Either.getOrThrow)

      expect(result.description).toBe("Thousands test")
      expect(result.value).toBe(666642)
      expect(result.date.toISOString()).toBe("2020-01-16T00:00:00.000Z")
    })
  })
})
