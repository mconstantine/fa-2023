import { Container, Stack, Typography } from "@mui/material"
import NonBlankInput from "../forms/inputs/NonBlankInput"
import { StringArrayInput } from "../forms/inputs/StringArrayInput"
import { Category } from "./domain"
import { useForm } from "../../hooks/useForm"
import Form from "../forms/Form"
import { NetworkResponse } from "../../network/NetworkResponse"

interface Props {
  category: Category | null
  onSubmit(category: Category): void
  networkResponse: NetworkResponse<Category>
  cancelAction?: (() => void) | undefined
}

export default function CategoryForm(props: Props) {
  const { inputProps, submit, isValid } = useForm<Category>(
    {
      id: props.category?.id ?? null,
      name: props.category?.name ?? null,
      keywords: props.category?.keywords ?? [],
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
      <Stack spacing={1.5}>
        <Typography variant="h5">{title}</Typography>
        <Form
          onSubmit={submit}
          isValid={isValid}
          networkResponse={props.networkResponse}
          submitButtonLabel={submitButtonLabel}
          cancelAction={props.cancelAction}
        >
          <NonBlankInput
            {...inputProps("name", null)}
            label="Name"
            errorMessageWhenBlank="The category name cannot be blank"
            fieldProps={{ sx: { mb: 1.5 } }}
          />
          <StringArrayInput
            {...inputProps("keywords", [])}
            title="Keywords"
            label="Keyword"
            errorMessageWhenBlank="A keyword cannot be blank"
          />
        </Form>
      </Stack>
    </Container>
  )
}
