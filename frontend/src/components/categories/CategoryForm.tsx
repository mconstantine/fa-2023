import { Container, Typography } from "@mui/material"
import NonBlankInput from "../forms/inputs/NonBlankInput"
import { StringArrayInput } from "../forms/inputs/StringArrayInput"
import { Category } from "./domain"
import { useForm } from "../../hooks/useForm"
import Form from "../forms/Form"

interface Props {
  category: Category | null
  onSubmit(category: Category): void
}

export default function CategoryForm(props: Props) {
  const { inputProps, submit, isValid } = useForm<Category>(
    {
      id: props.category?.id ?? null,
      name: props.category?.name ?? null,
      keywords: props.category?.keywords ?? null,
    },
    props.onSubmit,
  )

  const title =
    props.category === null
      ? "New category"
      : `Edit category "${props.category.name}"`

  const submitButtonLabel = props.category === null ? "Create" : "Update"

  return (
    <Container>
      <Typography variant="h5" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      <Form
        onSubmit={submit}
        isValid={isValid}
        submitButtonLabel={submitButtonLabel}
      >
        <NonBlankInput
          {...inputProps("name", null)}
          name="name"
          label="Name"
          errorMessageWhenBlank="The category name cannot be blank"
          fieldProps={{ sx: { mb: 1.5 } }}
        />
        <StringArrayInput
          {...inputProps("keywords", [])}
          title="Keywords"
          name="keywords"
          label="Keyword"
          errorMessageWhenBlank="A keyword cannot be blank"
        />
      </Form>
    </Container>
  )
}
