export function dateFromItalianString(input: string): Date {
  const [dayString, monthPlusOneString, yearString] = input.split("/")

  if (
    typeof dayString === "undefined" ||
    typeof monthPlusOneString === "undefined" ||
    typeof yearString === "undefined"
  ) {
    throw new EvalError("malformed bank transaction: invalid value date field")
  }

  return new Date(
    parseInt(yearString),
    parseInt(monthPlusOneString) - 1,
    parseInt(dayString),
  )
}
