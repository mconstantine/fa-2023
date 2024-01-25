import { Param } from "../../hooks/network"

export interface MonthlyAggregationParams extends Record<string, Param> {
  year: number
}

export interface MonthlyAggregation {
  month: number
  income: number
  outcome: number
  total: number
}
