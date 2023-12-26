import fs from "fs"
import path from "path"
import { BankEntry } from "./models/BankEntry"
import { CategorizedBankEntry, Category } from "./models/CategorizedBankEntry"
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

const categorizedBankEntries: CategorizedBankEntry[] = bankEntries
  .filter((entry) => entry.value < 0)
  .map((bankEntry) => {
    const reason = bankEntry.reason.toLowerCase()

    if (reason.includes("addebito canone")) {
      return CategorizedBankEntry.fromBankEntry(bankEntry, Category.BANK)
    } else if (reason.includes("octopus")) {
      return CategorizedBankEntry.fromBankEntry(bankEntry, Category.OCTOPUS)
    } else if (reason.includes("digitalocean.com")) {
      return CategorizedBankEntry.fromBankEntry(bankEntry, Category.SERVER)
    } else if (
      reason.includes("mg billing limited") ||
      reason.includes("aylo billing")
    ) {
      return CategorizedBankEntry.fromBankEntry(bankEntry, Category.PORN)
    } else if (reason.includes("telepass") || reason.includes("unipolmove")) {
      return CategorizedBankEntry.fromBankEntry(bankEntry, Category.TELEPASS)
    } else if (reason.includes("esselunga") || reason.includes("amazon ufg")) {
      return CategorizedBankEntry.fromBankEntry(bankEntry, Category.GROCERIES)
    } else if (reason.includes("az fund")) {
      return CategorizedBankEntry.fromBankEntry(bankEntry, Category.INVESTMENTS)
    } else if (reason.includes("santander")) {
      return CategorizedBankEntry.fromBankEntry(bankEntry, Category.BIKE)
    } else if (reason.includes("matteo bonanno")) {
      return CategorizedBankEntry.fromBankEntry(bankEntry, Category.RENT)
    } else if (reason.includes("capellimania")) {
      return CategorizedBankEntry.fromBankEntry(bankEntry, Category.HAIRDRESSER)
    } else if (reason.includes("enjoy")) {
      return CategorizedBankEntry.fromBankEntry(bankEntry, Category.CARSHARING)
    } else if (reason.includes("esseemme") || reason.includes("unipolsai")) {
      return CategorizedBankEntry.fromBankEntry(bankEntry, Category.INSURANCE)
    } else if (reason.includes("amazon prime")) {
      return CategorizedBankEntry.fromBankEntry(
        bankEntry,
        Category.SUBSCRIPTIONS,
      )
    } else if (
      reason.includes("agenzia entrate") ||
      reason.includes("spservices")
    ) {
      return CategorizedBankEntry.fromBankEntry(bankEntry, Category.TAXES)
    } else if (reason.includes("paypal")) {
      // TODO:
      return CategorizedBankEntry.fromBankEntry(bankEntry, Category.UNKNOWN)
    } else if (
      reason.includes("eni") ||
      reason.includes("staroil") ||
      reason.includes("tamoil") ||
      reason.includes("q8") ||
      reason.includes("pv1244")
    ) {
      return CategorizedBankEntry.fromBankEntry(bankEntry, Category.GAS)
    } else {
      return CategorizedBankEntry.fromBankEntry(bankEntry, Category.MISC)
    }
  })

Object.entries(Category).forEach(([, category]) => {
  const entries = categorizedBankEntries.filter(
    (entry) => entry.category === category,
  )

  const count = entries.length
  const totalValue = entries.reduce((sum, entry) => sum + entry.value, 0)

  console.log(`${category} (${count}): ${totalValue.toFixed(2)}`)
})
