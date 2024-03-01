import { RelativeRange } from "./domain"

const DAY_IN_MS = 1000 * 60 * 60 * 24
const WEEK_IN_MS = DAY_IN_MS * 7

export class RelativeTimeRange {
  public constructor(
    public readonly last: number,
    public readonly range: RelativeRange,
    public readonly since: Date,
  ) {}

  public static fromDateRange(r: DateTimeRange): RelativeTimeRange {
    const differenceInYears = getDifferenceInYears(r.dateSince, r.dateUntil)

    if (differenceInYears !== null) {
      return new RelativeTimeRange(differenceInYears, "years", r.dateUntil)
    }

    const differenceInMonths = getDifferenceInMonths(r.dateSince, r.dateUntil)

    if (differenceInMonths !== null) {
      return new RelativeTimeRange(differenceInMonths, "months", r.dateUntil)
    }

    const differenceInWeeks = getDifferenceInWeeks(r.dateSince, r.dateUntil)

    if (differenceInWeeks !== null) {
      return new RelativeTimeRange(differenceInWeeks, "weeks", r.dateUntil)
    }

    return new RelativeTimeRange(
      getDifferenceInDays(r.dateSince, r.dateUntil),
      "days",
      r.dateUntil,
    )
  }
}

export class DateTimeRange {
  public constructor(
    public readonly dateSince: Date,
    public readonly dateUntil: Date,
  ) {}

  public static fromRelativeTimeRange(rtr: RelativeTimeRange): DateTimeRange {
    const startOfDay = new Date(
      rtr.since.getFullYear(),
      rtr.since.getMonth(),
      rtr.since.getDate(),
    )

    const startDate: Date = (() => {
      switch (rtr.range) {
        case "days":
          return new Date(startOfDay.getTime() - DAY_IN_MS * rtr.last)
        case "weeks":
          return new Date(startOfDay.getTime() - WEEK_IN_MS * rtr.last)
        case "months":
          return new Date(
            startOfDay.getFullYear(),
            startOfDay.getMonth() - rtr.last,
            startOfDay.getDate(),
          )
        case "years":
          return new Date(
            startOfDay.getFullYear() - rtr.last,
            startOfDay.getMonth(),
            startOfDay.getDate(),
          )
      }
    })()

    return new DateTimeRange(startDate, startOfDay)
  }
}

function getDifferenceInDays(startDate: Date, endDate: Date): number {
  const deltaMs = endDate.getTime() - startDate.getTime()
  return Math.floor(deltaMs / DAY_IN_MS)
}

function getDifferenceInWeeks(startDate: Date, endDate: Date): number | null {
  const deltaMs = endDate.getTime() - startDate.getTime()

  if (deltaMs % WEEK_IN_MS === 0) {
    return deltaMs / WEEK_IN_MS
  } else {
    return null
  }
}

function getDifferenceInMonths(startDate: Date, endDate: Date): number | null {
  if (startDate.getDate() === endDate.getDate()) {
    return (
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth())
    )
  } else {
    return null
  }
}

function getDifferenceInYears(startDate: Date, endDate: Date): number | null {
  if (
    startDate.getDate() === endDate.getDate() &&
    startDate.getMonth() === endDate.getMonth()
  ) {
    return endDate.getFullYear() - startDate.getFullYear()
  } else {
    return null
  }
}
