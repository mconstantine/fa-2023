import { useQuery } from "../../network"
import Query from "../Query"
import CategoriesList from "./CategoriesList"
import { Category } from "./domain"

export default function CategoriesPage() {
  const response = useQuery<Category[]>("/categories/")

  return (
    <Query
      response={response}
      render={(categories) => <CategoriesList categories={categories} />}
    />
  )
}
