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

export interface CategoriesAndTimeAggregation extends Record<string, number> {
  time: number
  total: number
}
