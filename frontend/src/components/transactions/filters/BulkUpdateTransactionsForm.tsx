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

export interface BulkUpdateTransactionsData {
  description?: string | undefined
  categoryIds?: string[] | undefined
}

interface BulkUpdateTransactionFormData extends Record<string, unknown> {
  description: string
  categorySelection: Category[]
}

interface Props {
  networkResponse: NetworkResponse<unknown>
  onSubmit(data: BulkUpdateTransactionsData): void
  onCancel(): void
}

// TODO: use the props
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function BulkUpdateTransactionsForm(_props: Props) {
  const [data, setData] = useState<BulkUpdateTransactionFormData>({
    description: "",
    categorySelection: [],
  })

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

  const categorySelectionResponse = categoriesListResponse.flatMap(
    (categories) =>
      createCategoriesResponse.match({
        whenIdle: () => networkResponse.fromSuccess(categories),
        whenLoading: () => createCategoriesResponse,
        whenFailed: () => createCategoriesResponse,
        whenSuccessful: () => networkResponse.fromSuccess(categories),
      }),
  )

  const onDescriptionChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setData((data) => ({ ...data, description: event.currentTarget.value }))
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

          setData((data) => ({
            ...data,
            categorySelection: [...selection.categories, ...response],
          }))
        }
      })
    } else {
      setData((data) => ({ ...data, categorySelection: selection.categories }))
    }
  }

  return (
    <Stack spacing={1.5}>
      <Typography variant="h5">Update transactions</Typography>
      <TextField
        label="Description"
        value={data.description}
        onChange={onDescriptionChange}
      />
      <CategorySelect
        networkResponse={categorySelectionResponse}
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        selection={data.categorySelection}
        onSubmit={onCategorySelectionChange}
      />
    </Stack>
  )
}
