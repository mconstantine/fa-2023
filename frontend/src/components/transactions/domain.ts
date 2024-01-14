import { Category } from "../categories/domain"

export interface Transaction extends Record<string, unknown> {
  id: string
  description: string
  date: string
  value: number
  categories: Category[]
}

export interface FindTransactionsParams
  extends Record<string, string | undefined> {
  query?: string | undefined
  startDate?: string | undefined
  endDate?: string | undefined
}

export interface BulkUpdateTransactionsBody {
  ids: string[]
  description?: string | undefined
  categoryIds?: string[] | undefined
}
