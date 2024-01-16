import { PaginationParams } from "../../globalDomain"
import { Category } from "../categories/domain"
import { CategoryUpdateMode } from "./bulkUpdate/CategoryUpdateMode"

export interface Transaction extends Record<string, unknown> {
  id: string
  description: string
  date: string
  value: number
  categories: Category[]
}

interface BaseFindTransactionsParams extends PaginationParams {
  query?: string | undefined
  startDate?: string | undefined
  endDate?: string | undefined
}

export enum CategoryMode {
  ALL = "all",
  UNCATEGORIZED = "uncategorized",
  SPECIFIC = "specific",
}

interface SpecificCategoriesFindTransactionsParams
  extends BaseFindTransactionsParams {
  categoryMode: CategoryMode.SPECIFIC
  categories: string[]
}

interface NonSpecificCategoriesFindTransactionsParams
  extends BaseFindTransactionsParams {
  categoryMode: CategoryMode.ALL | CategoryMode.UNCATEGORIZED
}

export type FindTransactionsParams =
  | SpecificCategoriesFindTransactionsParams
  | NonSpecificCategoriesFindTransactionsParams

export interface BulkUpdateTransactionsBody {
  ids: string[]
  description?: string | undefined
  categoryIds?: string[] | undefined
  categoryUpdateMode: CategoryUpdateMode
}
