import { Option } from "effect"

export function dateFromItalianString(input: string): Option.Option<Date> {
  const [dayString, monthPlusOneString, yearString] = input.split("/")

  if (
    typeof dayString === "undefined" ||
    typeof monthPlusOneString === "undefined" ||
    typeof yearString === "undefined"
  ) {
    return Option.none()
  }

  return Option.some(
    new Date(
      parseInt(yearString),
      parseInt(monthPlusOneString) - 1,
      parseInt(dayString),
    ),
  )
}
