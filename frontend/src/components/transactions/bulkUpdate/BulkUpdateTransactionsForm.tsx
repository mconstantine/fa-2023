import { Stack, TextField, Typography } from "@mui/material"
import {
  NetworkResponse,
  networkResponse,
} from "../../../network/NetworkResponse"
import CategorySelect, {
  CategorySelection,
} from "../../forms/inputs/CategorySelect"
import { ChangeEventHandler, useState } from "react"
import { useCommand, useQuery } from "../../../hooks/network"
import {
  Category,
  CategoryBulkCreationBody,
  FindCategoryParams,
} from "../../categories/domain"
import { useDebounce } from "../../../hooks/useDebounce"
import { useForm } from "../../../hooks/useForm"
import Form from "../../forms/Form"
import { CategoryUpdateMode } from "./CategoryUpdateMode"
import ValidatedSelect from "../../forms/inputs/ValidatedSelect"

export interface BulkUpdateTransactionsData {
  description?: string | undefined
  categoryIds?: string[] | undefined
  categoryUpdateMode: CategoryUpdateMode
}

interface BulkUpdateTransactionFormData extends Record<string, unknown> {
  description: string
  categorySelection: Category[]
  categoryUpdateMode: CategoryUpdateMode
}

interface Props {
  networkResponse: NetworkResponse<unknown>
  onSubmit(data: BulkUpdateTransactionsData): void
  onCancel(): void
}

export default function BulkUpdateTransactionsForm(props: Props) {
  const { inputProps, submit } = useForm<BulkUpdateTransactionFormData>(
    {
      description: "",
      categorySelection: [],
      categoryUpdateMode: CategoryUpdateMode.REPLACE,
    },
    (data) => {
      if (data.description !== "" || data.categorySelection.length > 0) {
        props.onSubmit({
          ...(data.description !== ""
            ? {
                description: data.description,
              }
            : {}),
          ...(data.categorySelection.length > 0
            ? {
                categoryIds: data.categorySelection.map(
                  (category) => category.id,
                ),
              }
            : {}),
          categoryUpdateMode: data.categoryUpdateMode,
        })
      } else {
        props.onCancel()
      }
    },
  )

  const [searchQuery, setSearchQuery] = useState("")
  const [searchParams, setSearchParams] = useState<FindCategoryParams>({})
  const debounceSetSearchParams = useDebounce(setSearchParams, 500)

  const [categoriesListResponse, updateCategoriesList] = useQuery<
    FindCategoryParams,
    Category[]
  >("/categories", searchParams)

  const [createCategoriesResponse, createCategories] = useCommand<
    CategoryBulkCreationBody,
    Category[]
  >("POST", "/categories/bulk")

  const categorySelectionResponse: NetworkResponse<Category[]> =
    categoriesListResponse
      .flatMap((categories) =>
        createCategoriesResponse.match({
          whenIdle: () => networkResponse.fromSuccess(categories),
          whenLoading: () => createCategoriesResponse,
          whenFailed: () => createCategoriesResponse,
          whenSuccessful: () => networkResponse.fromSuccess(categories),
        }),
      )
      .flatMap((categories) =>
        props.networkResponse.match({
          whenIdle: () => networkResponse.fromSuccess(categories),
          whenLoading: () =>
            props.networkResponse as NetworkResponse<Category[]>,
          whenFailed: () =>
            props.networkResponse as NetworkResponse<Category[]>,
          whenSuccessful: () => networkResponse.fromSuccess(categories),
        }),
      )

  const onDescriptionChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    inputProps("description", "").onChange(event.currentTarget.value)
  }

  function onSearchQueryChange(query: string): void {
    setSearchQuery(query)
    debounceSetSearchParams(query === "" ? {} : { query })
  }

  function onCategorySelectionChange(selection: CategorySelection): void {
    if (selection.additions.length > 0) {
      createCategories({ categories: selection.additions }).then((response) => {
        if (response !== null) {
          updateCategoriesList((list) => [...list, ...response])

          inputProps("categorySelection", []).onChange([
            ...selection.categories,
            ...response,
          ])
        }
      })
    } else {
      inputProps("categorySelection", []).onChange(selection.categories)
    }
  }

  return (
    <Stack spacing={1.5}>
      <Typography variant="h5">Update transactions</Typography>
      <Form
        onSubmit={submit}
        networkResponse={categorySelectionResponse}
        submitButtonLabel="Save"
        cancelAction={props.onCancel}
        isValid={() => true}
      >
        <TextField
          label="Description"
          value={inputProps("description", "").value}
          onChange={onDescriptionChange}
        />
        <CategorySelect
          creatable
          networkResponse={categorySelectionResponse}
          searchQuery={searchQuery}
          onSearchQueryChange={onSearchQueryChange}
          selection={inputProps("categorySelection", []).value}
          onSubmit={onCategorySelectionChange}
        />
        <ValidatedSelect
          label="Categories update mode"
          {...inputProps("categoryUpdateMode", null)}
          options={CategoryUpdateMode}
          optionLabels={{
            ADD: "Add categories",
            REPLACE: "Replace categories",
          }}
        />
      </Form>
    </Stack>
  )
}
