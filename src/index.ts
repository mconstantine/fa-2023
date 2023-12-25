import fs from "fs"
import path from "path"
import { BankEntry } from "./models/BankEntry"
import { computeTotals } from "./operations/computeTotals"

const bankDataString = fs.readFileSync(
  path.join(__dirname, "./data/bank-data.csv"),
  "utf-8",
)

const bankDataRows = bankDataString
  .split("\n")
  .filter((row) => row !== "")
  .map((row) => row.split(";"))

const bankEntries = bankDataRows.map((row) =>
  BankEntry.fromCSV(row as [string, string, string]),
)

const totals = computeTotals(bankEntries)

console.log(`
  Income: ${totals.income.toFixed(2)}
  Outcome: ${totals.outcome.toFixed(2)}
  Total: ${totals.total.toFixed(2)}
`)
