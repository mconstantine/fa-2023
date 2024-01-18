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

export interface Prediction {
  id: string
  year: number
  value: number
  category: Category
}

export interface PredictionCreationBody {
  year: number
  value: number
  categoryId: string | null
}

export function isPrediction(
  subject: Prediction | PredictionCreationBody,
): subject is Prediction {
  return "id" in subject
}
