import { useCommand, useQuery } from "../../hooks/network"
import CategoriesList from "./CategoriesList"
import { Category } from "./domain"

export default function CategoriesPage() {
  const [readingResponse, updateCategories] =
    useQuery<Category[]>("/categories/")

  const [updateResponse, updateCategory] = useCommand<Category, Category>(
    "PUT",
    "/categories/",
  )

  const [creationResponse, createCategory] = useCommand<Category, Category>(
    "POST",
    "/categories/",
  )

  async function onCategoryCreate(category: Category): Promise<boolean> {
    const response = await createCategory(category)
    const isSuccess = response !== null

    if (isSuccess) {
      updateCategories((categories) => [category, ...categories])
    }

    return isSuccess
  }

  async function onCategoryUpdate(category: Category): Promise<boolean> {
    const response = await updateCategory(category)
    const isSuccess = response !== null

    if (isSuccess) {
      updateCategories((categories) =>
        categories.map((category) => {
          if (category.id === response.id) {
            return response
          } else {
            return category
          }
        }),
      )
    }

    return isSuccess
  }

  return (
    <CategoriesList
      readingResponse={readingResponse}
      creationResponse={creationResponse}
      updateResponse={updateResponse}
      // deleteResponse={}
      onCategoryCreate={onCategoryCreate}
      onCategoryUpdate={onCategoryUpdate}
      // onCategoryDelete={}
    />
  )
}
