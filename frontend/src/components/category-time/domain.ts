import { Param } from "../../hooks/network"

export enum TimeRange {
  WEEK = "WEEK",
  MONTH = "MONTH",
  DAY = "DOY",
}

export interface CategoriesAndTimeAggregationParams
  extends Record<string, Param> {
  timeRange: TimeRange
  categoryIds: string[]
  year: number
}

export interface TimeAggregation extends Record<string, number> {
  time: number
  total: number
}

export interface CategoryAggregation {
  id: string
  name: string
  keywords: string
  isMeta: boolean
  max_transaction_value: number
  min_transaction_value: number
  total: number
}

export interface CategoriesAndTimeAggregation {
  time: TimeAggregation[]
  categories: CategoryAggregation[]
}
