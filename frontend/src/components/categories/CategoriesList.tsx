import { Button, Container, Paper, Typography } from "@mui/material"
import CategoryCard from "./CategoryCard"
import { Category } from "./domain"

interface Props {
  categories: Category[]
}

export default function CategoriesList(props: Props) {
  return (
    <Container>
      <Paper
        sx={{
          mt: 1.5,
          p: 1.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h5">Categories</Typography>
        <Button>Add category</Button>
      </Paper>
      {props.categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </Container>
  )
}
