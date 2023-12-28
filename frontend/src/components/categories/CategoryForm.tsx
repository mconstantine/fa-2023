import { Button, Container, Typography } from "@mui/material"
import NonBlankInput from "../input/NonBlankInput"
import { StringArrayInput } from "../input/StringArrayInput"
import { Category } from "./domain"
import { FormEvent, useState } from "react"

interface Props {
  category: Category | null
  onSubmit(category: Category): void
}

type CategoryData = {
  [key in keyof Category]: Category[key] | null
}

function isValidCategory(subject: CategoryData): subject is Category {
  return Object.entries(subject)
    .filter(([key]) => key !== "id")
    .every(([, value]) => value !== null)
}

export default function CategoryForm(props: Props) {
  const [category, setCategory] = useState<CategoryData>({
    id: props.category?.id ?? null,
    name: props.category?.name ?? null,
    keywords: props.category?.keywords ?? null,
  })

  const title =
    props.category === null
      ? "New category"
      : `Edit category "${props.category.name}"`

  const buttonLabel = props.category === null ? "Create" : "Update"

  function onNameChange(name: string): void {
    setCategory({ ...category, name })
  }

  function onKeywordsChange(keywords: string[]): void {
    setCategory({ ...category, keywords })
  }

  function onSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault()

    if (isValidCategory(category)) {
      props.onSubmit(category)
    }
  }

  return (
    <Container>
      <Typography variant="h5" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      <form onSubmit={onSubmit}>
        <NonBlankInput
          name="name"
          label="Name"
          errorMessageWhenBlank="The category name cannot be blank"
          value={category.name}
          onChange={onNameChange}
          fieldProps={{ sx: { mb: 1.5 } }}
        />
        <StringArrayInput
          title="Keywords"
          name="keywords"
          label="Keyword"
          errorMessageWhenBlank="A keyword cannot be blank"
          value={category.keywords ?? []}
          onChange={onKeywordsChange}
        />
        <Button
          type="submit"
          variant="contained"
          sx={{ mt: 3 }}
          disabled={!isValidCategory(category)}
        >
          {buttonLabel}
        </Button>
      </form>
    </Container>
  )
}
