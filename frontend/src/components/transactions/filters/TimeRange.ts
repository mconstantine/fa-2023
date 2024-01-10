const DAY_IN_MS = 1000 * 60 * 60 * 24
const WEEK_IN_MS = DAY_IN_MS * 7

export class TimeRange {}

export class DateTimeRange extends TimeRange {
  public readonly startDate: Date
  public readonly endDate: Date

  public constructor(startDate: Date, endDate: Date) {
    super()
    this.startDate = startDate
    this.endDate = endDate
  }

  public toRelativeTimeRange(): RelativeTimeRange | null {
    const relativeTimeRange = relativeTimeRangeFromDates(
      this.startDate,
      this.endDate,
    )

    if (relativeTimeRange === null) {
      return null
    } else {
      const [last, range] = relativeTimeRange
      return new RelativeTimeRange(last, range)
    }
  }

  static fromRelativeTimeRange(
    subject: RelativeTimeRange,
    referenceDate = new Date(),
  ): DateTimeRange {
    const [startDate, endDate] = datesFromRelativeTimeRange(
      subject.last,
      subject.range,
      referenceDate,
    )

    return new DateTimeRange(startDate, endDate)
  }
}

export enum ShortcutRange {
  DAYS = "days",
  WEEKS = "weeks",
  MONTHS = "months",
  YEARS = "years",
}

export class RelativeTimeRange extends TimeRange {
  public readonly last: number
  public readonly range: ShortcutRange

  public constructor(last: number, range: ShortcutRange) {
    super()
    this.last = last
    this.range = range
  }

  public toDateTimeRange(referenceDate = new Date()): DateTimeRange {
    const [startDate, endDate] = datesFromRelativeTimeRange(
      this.last,
      this.range,
      referenceDate,
    )

    return new DateTimeRange(startDate, endDate)
  }

  public static fromDateTimeRange(
    subject: DateTimeRange,
  ): RelativeTimeRange | null {
    const relativeTimeRange = relativeTimeRangeFromDates(
      subject.startDate,
      subject.endDate,
    )

    if (relativeTimeRange === null) {
      return null
    } else {
      const [last, range] = relativeTimeRange
      return new RelativeTimeRange(last, range)
    }
  }
}

function getDifferenceInDays(startDate: Date, endDate: Date): number | null {
  const deltaMs = endDate.getTime() - startDate.getTime()

  if (deltaMs % DAY_IN_MS === 0) {
    return deltaMs / DAY_IN_MS
  } else {
    return null
  }
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

function datesFromRelativeTimeRange(
  last: number,
  range: ShortcutRange,
  referenceDate: Date,
): [startDate: Date, endDate: Date] {
  const startOfToday = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  )

  const startDate: Date = (() => {
    switch (range) {
      case ShortcutRange.DAYS:
        return new Date(startOfToday.getTime() - DAY_IN_MS * last)
      case ShortcutRange.WEEKS:
        return new Date(startOfToday.getTime() - WEEK_IN_MS * last)
      case ShortcutRange.MONTHS:
        return new Date(
          startOfToday.getFullYear(),
          startOfToday.getMonth() - last,
          startOfToday.getDate(),
        )
      case ShortcutRange.YEARS:
        return new Date(
          startOfToday.getFullYear() - last,
          startOfToday.getMonth(),
          startOfToday.getDate(),
        )
    }
  })()

  return [startDate, startOfToday]
}

function relativeTimeRangeFromDates(
  startDate: Date,
  endDate: Date,
): [last: number, range: ShortcutRange] | null {
  const differenceInYears = getDifferenceInYears(startDate, endDate)

  if (differenceInYears !== null) {
    return [differenceInYears, ShortcutRange.YEARS]
  }

  const differenceInMonths = getDifferenceInMonths(startDate, endDate)

  if (differenceInMonths !== null) {
    return [differenceInMonths, ShortcutRange.MONTHS]
  }

  const differenceInWeeks = getDifferenceInWeeks(startDate, endDate)

  if (differenceInWeeks !== null) {
    return [differenceInWeeks, ShortcutRange.WEEKS]
  }

  const differenceInDays = getDifferenceInDays(startDate, endDate)

  if (differenceInDays !== null) {
    return [differenceInDays, ShortcutRange.DAYS]
  }

  return null
}
