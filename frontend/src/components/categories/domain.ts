import { Param } from "../../hooks/network"

export interface Category extends Record<string, unknown> {
  id: string
  name: string
  keywords: string[]
  isMeta: boolean
}

export interface FindCategoryParams extends Record<string, Param> {
  query?: string
}

export interface CategoryCreationBody {
  name: string
  keywords: string[]
  isMeta: boolean
}

export function isCategory(
  subject: Category | CategoryCreationBody,
): subject is Category {
  return "id" in subject
}

export interface CategoryBulkCreationBody {
  categories: CategoryCreationBody[]
}
