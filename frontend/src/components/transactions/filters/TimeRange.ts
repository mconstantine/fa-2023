import * as S from "@effect/schema/Schema"
import { constTrue } from "effect/Function"

const DAY_IN_MS = 1000 * 60 * 60 * 24
const WEEK_IN_MS = DAY_IN_MS * 7

export class RelativeTimeRange extends S.Class<RelativeTimeRange>()({
  last: S.NumberFromString.pipe(S.compose(S.Int)).pipe(
    S.filter(constTrue, { message: () => "This should be a positive integer" }),
  ),
  range: S.literal("days", "weeks", "months", "years"),
  since: S.Date,
}) {
  public static fromDateRange(r: DateTimeRange): RelativeTimeRange {
    const differenceInYears = getDifferenceInYears(r.dateSince, r.dateUntil)

    if (differenceInYears !== null) {
      return new RelativeTimeRange({
        last: differenceInYears,
        range: "years",
        since: r.dateUntil,
      })
    }

    const differenceInMonths = getDifferenceInMonths(r.dateSince, r.dateUntil)

    if (differenceInMonths !== null) {
      return new RelativeTimeRange({
        last: differenceInMonths,
        range: "months",
        since: r.dateUntil,
      })
    }

    const differenceInWeeks = getDifferenceInWeeks(r.dateSince, r.dateUntil)

    if (differenceInWeeks !== null) {
      return new RelativeTimeRange({
        last: differenceInWeeks,
        range: "weeks",
        since: r.dateUntil,
      })
    }

    return new RelativeTimeRange({
      last: getDifferenceInDays(r.dateSince, r.dateUntil),
      range: "days",
      since: r.dateUntil,
    })
  }
}

export class DateTimeRange extends S.Class<DateTimeRange>()({
  dateSince: S.Date,
  dateUntil: S.Date,
}) {
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

    return new DateTimeRange({
      dateSince: startDate,
      dateUntil: startOfDay,
    })
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
