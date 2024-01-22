import { Stack, Typography } from "@mui/material"
import { useForm } from "../../hooks/useForm"
import Form from "../forms/Form"
import { NetworkResponse, networkResponse } from "../../network/NetworkResponse"
import CategorySelect from "../forms/inputs/CategorySelect"
import NumberInput from "../forms/inputs/NumberInput"
import { useEffect, useState } from "react"
import {
  Category,
  CategoryCreationBody,
  FindCategoryParams,
  isCategory,
} from "../categories/domain"
import { useCommand, useLazyQuery } from "../../hooks/network"
import { PredictionCreationBody } from "./domain"

interface Props {
  year: number
  isVisible: boolean
  excludedCategoriesIds: Array<string | null>
  networkResponse: NetworkResponse<unknown>
  onSubmit(prediction: PredictionCreationBody): void
}

interface FormData extends Record<string, unknown> {
  year: number
  category: Category
  value: number
}

export default function PredictionCreationForm(props: Props) {
  const [searchQuery, setSearchQuery] = useState("")
  const [category, setCategory] = useState<Category | null>(null)

  const [categoriesResponse, updateCategories, fetchCategories] = useLazyQuery<
    Category[],
    FindCategoryParams
  >("/categories")

  const [createCategoryResponse, createCategory] = useCommand<
    CategoryCreationBody,
    Category
  >("POST", "/categories")

  const { inputProps, submit, isValid } = useForm<FormData>(
    {
      year: props.year,
      category: null,
      value: 0,
    },
    (data) => props.onSubmit({ ...data, categoryId: data.category.id }),
  )

  const categorySelectionResponse = createCategoryResponse
    .match<NetworkResponse<Category[]>>({
      whenIdle: () => categoriesResponse,
      whenSuccessful: () => categoriesResponse,
      whenFailed: (response) =>
        networkResponse.fromFailure<Category[]>(
          response.status,
          response.message,
        ),
      whenLoading: () => networkResponse.make<Category[]>().load(),
    })
    .map((categories) =>
      categories.filter(
        (category) =>
          !props.excludedCategoriesIds.includes(category.id) &&
          !category.isMeta,
      ),
    )

  function onCategorySearchQueryChange(query: string): void {
    setSearchQuery(query)
    fetchCategories(query === "" ? {} : { query })
  }

  async function onCategorySelectionChange(
    selection: Category | CategoryCreationBody,
  ) {
    if (isCategory(selection)) {
      setCategory(selection)
      inputProps("category", null).onChange(selection)
    } else {
      createCategory(selection).then((category) => {
        if (category !== null) {
          setCategory(category)
          inputProps("category", null).onChange(category)
          updateCategories((categories) => [category, ...categories])
        }
      })
    }
  }

  useEffect(() => {
    if (props.isVisible && categoriesResponse.isIdle()) {
      fetchCategories({})
    }
  }, [props.isVisible, categoriesResponse, fetchCategories])

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Create prediction</Typography>
      <Form
        onSubmit={submit}
        isValid={isValid}
        networkResponse={props.networkResponse}
        submitButtonLabel="Save"
      >
        <CategorySelect
          multiple={false}
          creatable
          networkResponse={categorySelectionResponse}
          searchQuery={searchQuery}
          onSearchQueryChange={onCategorySearchQueryChange}
          selection={category}
          onSubmit={onCategorySelectionChange}
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
