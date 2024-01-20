import {
  Dialog,
  DialogContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import {
  NetworkResponse,
  networkResponse,
} from "../../../network/NetworkResponse"
import { Transaction } from "../domain"
import { useForm } from "../../../hooks/useForm"
import {
  Category,
  CategoryBulkCreationBody,
  FindCategoryParams,
} from "../../categories/domain"
import { CategoryUpdateMode } from "./CategoryUpdateMode"
import { ChangeEventHandler, useEffect, useState } from "react"
import { useDebounce } from "../../../hooks/useDebounce"
import { useCommand, useLazyQuery } from "../../../hooks/network"
import CategorySelect, {
  CategorySelection,
} from "../../forms/inputs/CategorySelect"
import Form from "../../forms/Form"
import ValidatedSelect from "../../forms/inputs/ValidatedSelect"

interface Props {
  isOpen: boolean
  onOpenChange(isOpen: boolean): void
  updateTransactionsNetworkResponse: NetworkResponse<Transaction[]>
  onBulkUpdate(data: BulkUpdateTransactionsData): Promise<boolean>
}

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

export default function BulkUpdateTransactionsDialog(props: Props) {
  const [searchQuery, setSearchQuery] = useState("")

  const [categoriesListResponse, updateCategoriesList, fetchCategories] =
    useLazyQuery<Category[], FindCategoryParams>("/categories")

  const debounceFetchCategories = useDebounce(function (query: string) {
    fetchCategories(query === "" ? {} : { query })
  }, 500)

  const [createCategoriesResponse, createCategories] = useCommand<
    CategoryBulkCreationBody,
    Category[]
  >("POST", "/categories/bulk")

  const { inputProps, submit } = useForm<BulkUpdateTransactionFormData>(
    {
      description: "",
      categorySelection: [],
      categoryUpdateMode: CategoryUpdateMode.REPLACE,
    },
    (data) => {
      if (data.description !== "" || data.categorySelection.length > 0) {
        onBulkUpdateSubmit({
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
        props.onOpenChange(false)
      }
    },
  )

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
        props.updateTransactionsNetworkResponse.match<
          NetworkResponse<Category[]>
        >({
          whenIdle: () => networkResponse.fromSuccess(categories),
          whenLoading: () => networkResponse.make<Category[]>().load(),
          whenFailed: (response) =>
            networkResponse.fromFailure<Category[]>(
              response.status,
              response.message,
            ),
          whenSuccessful: () => networkResponse.fromSuccess(categories),
        }),
      )

  const onDescriptionChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    inputProps("description", "").onChange(event.currentTarget.value)
  }

  function onSearchQueryChange(query: string): void {
    setSearchQuery(query)
    debounceFetchCategories(query)
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

  function onBulkUpdateSubmit(data: BulkUpdateTransactionsData): void {
    props.onBulkUpdate(data).then((didSucceed) => {
      if (didSucceed) {
        props.onOpenChange(false)
      }
    })
  }

  useEffect(() => {
    if (props.isOpen && categoriesListResponse.isIdle()) {
      fetchCategories({})
    }
  }, [props.isOpen, categoriesListResponse, fetchCategories])

  return (
    <Dialog open={props.isOpen} onClose={() => props.onOpenChange(false)}>
      <DialogContent>
        <Stack spacing={1.5}>
          <Typography variant="h5">Update transactions</Typography>
          <Form
            onSubmit={submit}
            networkResponse={categorySelectionResponse}
            submitButtonLabel="Save"
            cancelAction={() => props.onOpenChange(false)}
            isValid={() => true}
          >
            <TextField
              label="Description"
              value={inputProps("description", "").value}
              onChange={onDescriptionChange}
            />
            <CategorySelect
              creatable
              multiple
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
      </DialogContent>
    </Dialog>
  )
}
