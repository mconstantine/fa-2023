import { Param } from "../../hooks/network"

export interface CategoriesAggregationParams extends Record<string, Param> {
  year: number
}

export interface CategoriesAggregation {
  categoryId: string | null
  categoryName: string | null
  transactionsTotal: number
}
