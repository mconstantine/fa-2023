import type { BankEntry } from "../models/BankEntry"

interface Totals {
  income: number
  outcome: number
  total: number
}

export function computeTotals(bankEntries: BankEntry[]): Totals {
  return bankEntries.reduce<Totals>(
    ({ income, outcome, total }, entry) => {
      return {
        income: entry.value > 0 ? income + entry.value : income,
        outcome: entry.value < 0 ? outcome - entry.value : outcome,
        total: total + entry.value,
      }
    },
    {
      income: 0,
      outcome: 0,
      total: 0,
    },
  )
}
