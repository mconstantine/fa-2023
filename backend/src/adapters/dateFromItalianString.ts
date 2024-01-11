import { type Result, result } from "../Result"

export function dateFromItalianString(input: string): Result<void, Date> {
  const [dayString, monthPlusOneString, yearString] = input.split("/")

  if (
    typeof dayString === "undefined" ||
    typeof monthPlusOneString === "undefined" ||
    typeof yearString === "undefined"
  ) {
    return result.fromFailure(undefined)
  }

  return result.fromSuccess(
    new Date(
      parseInt(yearString),
      parseInt(monthPlusOneString) - 1,
      parseInt(dayString),
    ),
  )
}
