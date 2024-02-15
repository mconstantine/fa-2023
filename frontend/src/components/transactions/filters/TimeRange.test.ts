import { DateTimeRange, RelativeTimeRange } from "./TimeRange"

describe("TimeRange", () => {
  describe("Dates to relative", () => {
    it("should work with a day", () => {
      const result = RelativeTimeRange.fromDateRange(
        new DateTimeRange({
          dateSince: new Date(2020, 0, 1),
          dateUntil: new Date(2020, 0, 2),
        }),
      )

      expect(result.last).toBe(1)
      expect(result.range).toBe("days")
      expect(result.since).toEqual(new Date(2020, 0, 2))
    })

    it("should work with two weeks", () => {
      const result = RelativeTimeRange.fromDateRange(
        new DateTimeRange({
          dateSince: new Date(2020, 0, 1),
          dateUntil: new Date(2020, 0, 15),
        }),
      )

      expect(result.last).toBe(2)
      expect(result.range).toBe("weeks")
      expect(result.since).toEqual(new Date(2020, 0, 15))
    })

    it("should work with three months", () => {
      const result = RelativeTimeRange.fromDateRange(
        new DateTimeRange({
          dateSince: new Date(2020, 0, 1),
          dateUntil: new Date(2020, 3, 1),
        }),
      )

      expect(result.last).toBe(3)
      expect(result.range).toBe("months")
      expect(result.since).toEqual(new Date(2020, 3, 1))
    })

    it("should work with four years", () => {
      const result = RelativeTimeRange.fromDateRange(
        new DateTimeRange({
          dateSince: new Date(2020, 0, 1),
          dateUntil: new Date(2024, 0, 1),
        }),
      )

      expect(result.last).toBe(4)
      expect(result.range).toBe("years")
      expect(result.since).toEqual(new Date(2024, 0, 1))
    })

    it("should work with 117 days", () => {
      const result = RelativeTimeRange.fromDateRange(
        new DateTimeRange({
          dateSince: new Date(2020, 0, 1),
          dateUntil: new Date(2020, 3, 27),
        }),
      )

      expect(result.last).toBe(117)
      expect(result.range).toBe("days")
      expect(result.since).toEqual(new Date(2020, 3, 27))
    })
  })

  describe("Relative to dates", () => {
    it("should work with a day", () => {
      const result = DateTimeRange.fromRelativeTimeRange(
        new RelativeTimeRange({
          last: 1,
          range: "days",
          since: new Date(2020, 0, 2),
        }),
      )

      expect(result.dateSince).toEqual(new Date(2020, 0, 1))
      expect(result.dateUntil).toEqual(new Date(2020, 0, 2))
    })

    it("should work with two weeks", () => {
      const result = DateTimeRange.fromRelativeTimeRange(
        new RelativeTimeRange({
          last: 2,
          range: "weeks",
          since: new Date(2020, 0, 15),
        }),
      )

      expect(result.dateSince).toEqual(new Date(2020, 0, 1))
      expect(result.dateUntil).toEqual(new Date(2020, 0, 15))
    })

    it("should work with three months", () => {
      const result = DateTimeRange.fromRelativeTimeRange(
        new RelativeTimeRange({
          last: 3,
          range: "months",
          since: new Date(2020, 3, 1),
        }),
      )

      expect(result.dateSince).toEqual(new Date(2020, 0, 1))
      expect(result.dateUntil).toEqual(new Date(2020, 3, 1))
    })

    it("should work with four years", () => {
      const result = DateTimeRange.fromRelativeTimeRange(
        new RelativeTimeRange({
          last: 4,
          range: "years",
          since: new Date(2024, 0, 1),
        }),
      )

      expect(result.dateSince).toEqual(new Date(2020, 0, 1))
      expect(result.dateUntil).toEqual(new Date(2024, 0, 1))
    })

    it("should work with 117 days", () => {
      const result = DateTimeRange.fromRelativeTimeRange(
        new RelativeTimeRange({
          last: 117,
          range: "days",
          since: new Date(2020, 3, 27),
        }),
      )

      expect(result.dateSince).toEqual(new Date(2020, 0, 1))
      expect(result.dateUntil).toEqual(new Date(2020, 3, 27))
    })
  })
})
