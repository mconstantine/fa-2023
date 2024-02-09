import { useQuery, useRequestData } from "../../hooks/network"
import CategoriesList from "./CategoriesList"
import { listCategoriesRequest } from "./api"

export default function CategoriesPage() {
  const [data] = useRequestData<typeof listCategoriesRequest>({
    query: {
      direction: "forward",
      count: 20,
    },
  })

  const [categories] = useQuery(listCategoriesRequest, data)

  // const [updateResponse, updateCategory] = useCommand<Category, Category>(
  //   "PUT",
  //   "/categories/",
  // )

  // const [creationResponse, createCategory] = useCommand<Category, Category>(
  //   "POST",
  //   "/categories/",
  // )

  // const [deletionResponse, deleteCategory] = useCommand<
  //   Category,
  //   Omit<Category, "id">
  // >("DELETE", "/categories/")

  // async function onCategoryCreate(category: Category): Promise<boolean> {
  //   console.log("TODO: create category", { category })
  //   return true
  //   // const response = await createCategory(category)
  //   // const isSuccess = response !== null

  //   // if (isSuccess) {
  //   //   updateCategories((categories) => [category, ...categories])
  //   // }

  //   // return isSuccess
  // }

  // async function onCategoryUpdate(category: Category): Promise<boolean> {
  //   console.log("TODO: update category", category)
  //   return true
  //   // const response = await updateCategory(category)
  //   // const isSuccess = response !== null

  //   // if (isSuccess) {
  //   //   updateCategories((categories) =>
  //   //     categories.map((category) => {
  //   //       if (category.id === response.id) {
  //   //         return response
  //   //       } else {
  //   //         return category
  //   //       }
  //   //     }),
  //   //   )
  //   // }

  //   // return isSuccess
  // }

  // async function onCategoryDelete(deleted: Category): Promise<boolean> {
  //   console.log("TODO: delete category", { deleted })
  //   return true
  //   // const response = await deleteCategory(deleted)
  //   // const isSuccess = response !== null

  //   // if (isSuccess) {
  //   //   updateCategories((categories) =>
  //   //     categories.filter((category) => category.id !== deleted.id),
  //   //   )
  //   // }

  //   // return isSuccess
  // }

  return (
    <CategoriesList
      categories={categories}
      // creationResponse={creationResponse}
      // updateResponse={updateResponse}
      // deletionResponse={deletionResponse}
      // onCategoryCreate={onCategoryCreate}
      // onCategoryUpdate={onCategoryUpdate}
      // onCategoryDelete={onCategoryDelete}
    />
  )
}
