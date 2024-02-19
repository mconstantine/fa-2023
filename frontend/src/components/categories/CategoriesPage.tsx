import { Either, pipe } from "effect"
import { useCommand, useQuery, useRequestData } from "../../hooks/network"
import CategoriesList from "./CategoriesList"
import {
  deleteCategoryRequest,
  insertCategoryRequest,
  listCategoriesRequest,
  updateCategoryRequest,
} from "./api"
import { Category, InsertCategoryInput, ListCategoriesInput } from "./domain"
import { constFalse } from "effect/Function"
import * as paginationResponse from "../../network/PaginationResponse"

export default function CategoriesPage() {
  const [filters, setFilters] = useRequestData<typeof listCategoriesRequest>({
    query: {
      direction: "forward",
      count: 20,
    },
  })

  const [categories, updateCategories] = useQuery(
    listCategoriesRequest,
    filters,
  )

  const [newCategory, insertCategory] = useCommand(insertCategoryRequest)
  const [deletedCategory, deleteCategory] = useCommand(deleteCategoryRequest)
  const [updatedCategory, updateCategory] = useCommand(updateCategoryRequest)

  function onFiltersChange(filters: ListCategoriesInput): void {
    setFilters({ query: filters })
  }

  async function onCategoryInsert(body: InsertCategoryInput): Promise<boolean> {
    const response = await insertCategory({ body })

    return pipe(
      response,
      Either.match({
        onLeft: constFalse,
        onRight: (newCategory) => {
          updateCategories(paginationResponse.prepend(newCategory))
          return true
        },
      }),
    )
  }

  async function onCategoryUpdate(category: Category): Promise<boolean> {
    const response = await updateCategory({
      params: { id: category.id },
      body: category,
    })

    return pipe(
      response,
      Either.match({
        onLeft: constFalse,
        onRight: (updatedCategory) => {
          updateCategories(paginationResponse.replace(updatedCategory))
          return true
        },
      }),
    )
  }

  async function onCategoryDelete(deleted: Category): Promise<boolean> {
    const response = await deleteCategory({
      params: { id: deleted.id },
    })

    return pipe(
      response,
      Either.match({
        onLeft: constFalse,
        onRight: (deletedCategory) => {
          updateCategories(paginationResponse.remove(deletedCategory))
          return true
        },
      }),
    )
  }

  return (
    <CategoriesList
      filters={filters.query}
      categories={categories}
      insertionResponse={newCategory}
      updateResponse={updatedCategory}
      deletionResponse={deletedCategory}
      onFiltersChange={onFiltersChange}
      onCategoryInsert={onCategoryInsert}
      onCategoryUpdate={onCategoryUpdate}
      onCategoryDelete={onCategoryDelete}
    />
  )
}
