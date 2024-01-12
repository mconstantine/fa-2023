export interface Category extends Record<string, unknown> {
  id: string
  name: string
  keywords: string[]
}

export interface CategoryCreationBody {
  name: string
  keywords: string[]
}

export function isCategory(
  subject: Category | CategoryCreationBody,
): subject is Category {
  return "id" in subject
}
