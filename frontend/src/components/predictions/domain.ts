import { Param } from "../../hooks/network"

export interface CategoriesAggregationParams extends Record<string, Param> {
  year: number
}

export interface CategoriesAggregation {
  categoryId: string | null
  categoryName: string | null
  transactionsTotal: number
}

export interface Prediction {
  id: string
  year: number
  value: number
  categoryId: string | null
}

export interface PredictionCreationBody {
  year: number
  value: number
  categoryId?: string | null | undefined
}

export interface PredictionBulkCreationBody {
  predictions: PredictionCreationBody[]
}

export interface PredictionUpdateBody extends PredictionCreationBody {
  id: string
}

export interface PredictionBulkUpdateBody {
  predictions: PredictionUpdateBody[]
}

export function isPrediction(
  subject: Prediction | PredictionCreationBody,
): subject is Prediction {
  return "id" in subject
}
