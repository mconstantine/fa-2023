export class BankEntry {
  public readonly date: Date
  public readonly reason: string
  public readonly value: number

  protected constructor(date: Date, reason: string, value: number) {
    this.date = date
    this.reason = reason
    this.value = value
  }

  static fromCSV(
    row: [date: string, reason: string, valueWithComma: string],
  ): BankEntry {
    const [day, month, year] = row[0].split("/")

    if (
      typeof year === "undefined" ||
      typeof month === "undefined" ||
      typeof day === "undefined"
    ) {
      throw new TypeError(`Invalid date: ${row[0]}`)
    }

    const date = new Date(
      Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)),
    )

    const reason = row[1]
    const value = parseFloat(row[2].replace(",", "."))

    return new BankEntry(date, reason, value)
  }
}
