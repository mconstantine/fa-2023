import { PayPalAdapter } from "./PayPalAdapter"

describe("PayPalAdapter", () => {
  describe("parsing a row", () => {
    it("should work with all data", () => {
      const row =
        "15/01/2020;00:12:42;Europe/Berlin;All data test;EUR;-42;0;-42;-666,66;21D800331X157821M;all.data.test@example.com;All data test receiver;Bank name;Account number;0;0;Invoice number;Transaction code"

      const result = PayPalAdapter.fromString(row)

      expect(result.description).toBe(
        "All data test receiver<all.data.test@example.com>: All data test",
      )
      expect(result.value).toBe(-42.0)
      expect(result.date.toISOString()).toBe("2020-01-15T00:12:42.000+01:00")
    })

    it("should work with email and no name", () => {
      const row =
        "16/01/2020;01:13:43;Europe/Berlin;No name test;EUR;-69;0;-69;-666,66;21D800331X157821M;no.name.test@example.com;;Bank name;Account number;0;0;Invoice number;Transaction code"

      const result = PayPalAdapter.fromString(row)

      expect(result.description).toBe(
        "<no.name.test@example.com>: No name test",
      )
      expect(result.value).toBe(-69.0)
      expect(result.date.toISOString()).toBe("2020-01-16T01:13:43.000+01:00")
    })

    it("should work with name and no email", () => {
      const row =
        "17/01/2020;02:14:44;Europe/Berlin;No email test;EUR;42;0;42;-666,66;21D800331X157821M;;No email test receiver;Bank name;Account number;0;0;Invoice number;Transaction code"

      const result = PayPalAdapter.fromString(row)

      expect(result.description).toBe("No email test receiver<>: No email test")
      expect(result.value).toBe(42.0)
      expect(result.date.toISOString()).toBe("2020-01-17T02:14:44.000+01:00")
    })

    it("should work with no name and no email", () => {
      const row =
        "18/01/2020;03:15:45;Europe/Berlin;No receiver test;EUR;69;0;69;-666,66;21D800331X157821M;;;Bank name;Account number;0;0;Invoice number;Transaction code"

      const result = PayPalAdapter.fromString(row)

      expect(result.description).toBe("No receiver test")
      expect(result.value).toBe(69.0)
      expect(result.date.toISOString()).toBe("2020-01-18T00:15:45.000+01:00")
    })
  })
})
