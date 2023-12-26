import { useQuery } from "../../network"
import Query from "../Query"
import CategoryCard from "./CategoryCard"
import { Category } from "./domain"

export default function Categories() {
  const response = useQuery<Category[]>("/categories/")

  return (
    <Query
      response={response}
      render={(categories) => (
        <>
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </>
      )}
    />
  )
}
