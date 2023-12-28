import { Stack } from "@mui/material"
import CategoryCard from "./CategoryCard"
import { Category } from "./domain"

interface Props {
  categories: Category[]
  onEditButtonClick(category: Category): void
}

export default function CategoriesList(props: Props) {
  return (
    <Stack spacing={1.5}>
      {props.categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          onEditButtonClick={() => props.onEditButtonClick(category)}
        />
      ))}
    </Stack>
  )
}
