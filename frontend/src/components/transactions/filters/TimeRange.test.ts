import { DateTimeRange, RelativeTimeRange, ShortcutRange } from "./TimeRange"

describe("TimeRange", () => {
  describe("Dates to relative", () => {
    it("should work with a day", () => {
      const result = new DateTimeRange(
        new Date(2020, 0, 1),
        new Date(2020, 0, 2),
      ).toRelativeTimeRange()

      expect(result!.last).toBe(1)
      expect(result!.range).toBe(ShortcutRange.DAYS)
    })

    it("should work with two weeks", () => {
      const result = new DateTimeRange(
        new Date(2020, 0, 1),
        new Date(2020, 0, 15),
      ).toRelativeTimeRange()

      expect(result!.last).toBe(2)
      expect(result!.range).toBe(ShortcutRange.WEEKS)
    })

    it("should work with three months", () => {
      const result = new DateTimeRange(
        new Date(2020, 0, 1),
        new Date(2020, 3, 1),
      ).toRelativeTimeRange()

      expect(result!.last).toBe(3)
      expect(result!.range).toBe(ShortcutRange.MONTHS)
    })

    it("should work with four years", () => {
      const result = new DateTimeRange(
        new Date(2020, 0, 1),
        new Date(2024, 0, 1),
      ).toRelativeTimeRange()

      expect(result!.last).toBe(4)
      expect(result!.range).toBe(ShortcutRange.YEARS)
    })

    it("should work with 17 days", () => {
      const result = new DateTimeRange(
        new Date(2020, 0, 1),
        new Date(2020, 0, 18),
      ).toRelativeTimeRange()

      expect(result!.last).toBe(17)
      expect(result!.range).toBe(ShortcutRange.DAYS)
    })
  })

  describe("Relative to dates", () => {
    it("should work with a day", () => {
      const result = new RelativeTimeRange(
        1,
        ShortcutRange.DAYS,
      ).toDateTimeRange(new Date(2020, 0, 2))

      expect(result.startDate.toISOString()).toBe("2020-01-01T00:00:00.000Z")
      expect(result.endDate.toISOString()).toBe("2020-01-02T00:00:00.000Z")
    })

    it("should work with two weeks", () => {
      const result = new RelativeTimeRange(
        2,
        ShortcutRange.WEEKS,
      ).toDateTimeRange(new Date(2020, 0, 15))

      expect(result.startDate.toISOString()).toBe("2020-01-01T00:00:00.000Z")
      expect(result.endDate.toISOString()).toBe("2020-01-15T00:00:00.000Z")
    })

    it("should work with three months", () => {
      const result = new RelativeTimeRange(
        3,
        ShortcutRange.MONTHS,
      ).toDateTimeRange(new Date(2020, 3, 15))

      expect(result.startDate.toISOString()).toBe("2020-01-15T00:00:00.000Z")
      expect(result.endDate.toISOString()).toBe("2020-04-15T00:00:00.000Z")
    })

    it("should work with four years", () => {
      const result = new RelativeTimeRange(
        4,
        ShortcutRange.YEARS,
      ).toDateTimeRange(new Date(2024, 0, 1))

      expect(result.startDate.toISOString()).toBe("2020-01-01T00:00:00.000Z")
      expect(result.endDate.toISOString()).toBe("2024-01-01T00:00:00.000Z")
    })

    it("should work with 17 days", () => {
      const result = new RelativeTimeRange(
        17,
        ShortcutRange.DAYS,
      ).toDateTimeRange(new Date(2020, 0, 18))

      expect(result.startDate.toISOString()).toBe("2020-01-01T00:00:00.000Z")
      expect(result.endDate.toISOString()).toBe("2020-01-18T00:00:00.000Z")
    })
  })
})
