export interface Transaction extends Record<string, unknown> {
  id: string
  description: string
  date: string
  value: number
}

export interface FindTransactionsParams
  extends Record<string, string | undefined> {
  query?: string | undefined
  startDate?: string | undefined
  endDate?: string | undefined
}

export interface BulkUpdateTransactionsBody {
  ids: string[]
  description: string
}
