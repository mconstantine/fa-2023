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

export enum FindTransactionsBy {
  DESCRIPTION = "description",
  VALUE = "value",
}

interface BaseFindTransactionsByDescriptionParams {
  findBy: FindTransactionsBy.DESCRIPTION
  query?: string | undefined
}

interface BaseFindTransactionsByValueParams {
  findBy: FindTransactionsBy.VALUE
  min: number
  max: number
}

type BaseFindTransactionsParams = PaginationParams &
  (
    | BaseFindTransactionsByDescriptionParams
    | BaseFindTransactionsByValueParams
  ) & {
    startDate?: string | undefined
    endDate?: string | undefined
  }

export enum CategoryMode {
  ALL = "all",
  UNCATEGORIZED = "uncategorized",
  SPECIFIC = "specific",
}

type SpecificCategoriesFindTransactionsParams = BaseFindTransactionsParams & {
  categoryMode: CategoryMode.SPECIFIC
  categories: string[]
}

type NonSpecificCategoriesFindTransactionsParams =
  BaseFindTransactionsParams & {
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

export interface TransactionCreationBody {
  description: string
  value: number
  date: string
  categoryIds: string[]
}

export interface TransactionUpdateBody extends TransactionCreationBody {
  id: string
}
