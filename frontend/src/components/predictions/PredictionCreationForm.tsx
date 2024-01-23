import { Stack, Typography } from "@mui/material"
import { useForm } from "../../hooks/useForm"
import Form from "../forms/Form"
import { NetworkResponse } from "../../network/NetworkResponse"
import CategorySelect from "../forms/inputs/CategorySelect"
import NumberInput from "../forms/inputs/NumberInput"
import {
  Category,
  CategoryCreationBody,
  FindCategoryParams,
} from "../categories/domain"
import { useCommand, useLazyQuery } from "../../hooks/network"
import { PredictionCreationBody } from "./domain"
import { useCategorySelect } from "../../hooks/useCategorySelect"

interface Props {
  year: number
  isVisible: boolean
  excludedCategoriesIds: Array<string | null>
  networkResponse: NetworkResponse<unknown>
  onSubmit(prediction: PredictionCreationBody): void
  onCancel(): void
}

interface FormData extends Record<string, unknown> {
  year: number
  value: number
}

export default function PredictionCreationForm(props: Props) {
  const categoriesQuery = useLazyQuery<Category[], FindCategoryParams>(
    "/categories",
  )

  const createCategoryCommand = useCommand<CategoryCreationBody, Category>(
    "POST",
    "/categories",
  )

  const {
    categories,
    searchQuery,
    onSearchQueryChange,
    selection,
    onSelectionChange,
  } = useCategorySelect(
    props.isVisible,
    true,
    false,
    null,
    categoriesQuery,
    createCategoryCommand,
  )

  const { inputProps, submit, isValid } = useForm<FormData>(
    {
      year: props.year,
      value: 0,
    },
    (data) => {
      if (selection !== null) {
        props.onSubmit({ ...data, categoryId: selection.id })
      }
    },
  )

  const availableCategories = categories.map((categories) =>
    categories.filter(
      (category) =>
        !props.excludedCategoriesIds.includes(category.id) && !category.isMeta,
    ),
  )

  function onSelectionChangeUpdateForm(selection: Category): void {
    onSelectionChange(selection)
    inputProps("category", null).onChange(selection)
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Create prediction</Typography>
      <Form
        onSubmit={submit}
        isValid={() => isValid() && selection !== null}
        networkResponse={props.networkResponse}
        submitButtonLabel="Save"
        cancelAction={props.onCancel}
      >
        <CategorySelect
          multiple={false}
          creatable
          categories={availableCategories}
          searchQuery={searchQuery}
          onSearchQueryChange={onSearchQueryChange}
          selection={selection}
          onSelectionChange={onSelectionChangeUpdateForm}
        />

        <NumberInput
          {...inputProps("value", 0)}
          label="Value"
          errorMessage="The value of a prediction should be a number"
        />
      </Form>
    </Stack>
  )
}
