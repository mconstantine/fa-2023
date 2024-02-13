import * as S from "@effect/schema/Schema"
import {
  Checkbox,
  Container,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Stack,
  Typography,
} from "@mui/material"
import { StringArrayInput } from "../forms/inputs/StringArrayInput"
import { Category } from "./domain"
import { useForm } from "../../hooks/useForm"
import Form from "../forms/Form"
import { NetworkResponse } from "../../network/NetworkResponse"
import TextInput from "../forms/inputs/TextInput"
import { Either } from "effect"

interface Props {
  category: Category | null
  onSubmit(category: Category): void
  networkResponse: NetworkResponse<Category>
  cancelAction?: (() => void) | undefined
}

export default function CategoryForm(props: Props) {
  const { inputProps, submit, isValid, formError } = useForm({
    initialValues: {
      id: props.category?.id ?? null,
      name: props.category?.name ?? "",
      keywords: props.category?.keywords ?? ([] as string[]),
      is_meta: props.category?.is_meta ?? false,
    },
    validators: {
      name: S.Trim.pipe(
        S.nonEmpty({ message: () => "The category name cannot be empty" }),
      ),
      keywords: S.array(
        S.Trim.pipe(S.nonEmpty({ message: () => "Keywords cannot be empty" })),
      ),
      is_meta: S.boolean,
    },
    formValidator: (data) => {
      const uniqueKeywords = [...new Set(data.keywords)]

      if (uniqueKeywords.length !== data.keywords.length) {
        return Either.left("Duplicate keywords detected")
      } else {
        return Either.right(data)
      }
    },
    submit: props.onSubmit,
  })

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
          formError={formError}
        >
          <TextInput
            {...inputProps("name")}
            label="Name"
            fieldProps={{ sx: { mb: 1.5 } }}
          />
          <StringArrayInput
            {...inputProps("keywords")}
            title="Keywords"
            label="Keyword"
          />
          <FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  {...inputProps("is_meta")}
                  checked={inputProps("is_meta").value}
                  onChange={(_, checked) =>
                    inputProps("is_meta").onChange(checked)
                  }
                />
              }
              label="Is meta category"
            />
            <FormHelperText>
              Meta categories are excluded from predictions.
            </FormHelperText>
          </FormControl>
        </Form>
      </Stack>
    </Container>
  )
}
