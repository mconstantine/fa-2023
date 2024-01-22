import { Param } from "../../hooks/network"
import { Category } from "../categories/domain"

export interface CategoriesAggregationParams extends Record<string, Param> {
  year: number
}

export interface CategoriesAggregation {
  categoryId: string | null
  categoryName: string | null
  transactionsTotal: number
}

export interface Prediction extends Record<string, unknown> {
  id: string
  year: number
  value: number
  categoryId: string | null
  category: Category
}

export interface PredictionCreationBody extends Record<string, unknown> {
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
