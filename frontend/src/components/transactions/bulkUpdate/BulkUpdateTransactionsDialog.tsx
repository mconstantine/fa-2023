import {
  Dialog,
  DialogContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import { NetworkResponse } from "../../../network/NetworkResponse"
import { Transaction } from "../domain"
import { useForm } from "../../../hooks/useForm"
import {
  Category,
  CategoryBulkCreationBody,
  CategoryCreationBody,
  FindCategoryParams,
} from "../../categories/domain"
import { CategoryUpdateMode } from "./CategoryUpdateMode"
import { ChangeEventHandler } from "react"
import { useCommand, useLazyQuery } from "../../../hooks/network"
import CategorySelect from "../../forms/inputs/CategorySelect"
import Form from "../../forms/Form"
import ValidatedSelect from "../../forms/inputs/ValidatedSelect"
import { useCategorySelect } from "../../../hooks/useCategorySelect"

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
  categoryUpdateMode: CategoryUpdateMode
}

export default function BulkUpdateTransactionsDialog(props: Props) {
  const categoriesQuery = useLazyQuery<Category[], FindCategoryParams>(
    "/categories",
  )

  const createCategoryCommand = useCommand<CategoryCreationBody, Category>(
    "POST",
    "/categories",
  )

  const bulkCreateCategoriesCommand = useCommand<
    CategoryBulkCreationBody,
    Category[]
  >("POST", "/categories/bulk")

  const {
    categories,
    searchQuery,
    onSearchQueryChange,
    selection,
    onSelectionChange,
  } = useCategorySelect({
    visible: props.isOpen,
    multiple: true,
    creatable: true,
    initialValue: [],
    categoriesQuery,
    createCategoryCommand,
    bulkCreateCategoriesCommand,
  })

  const { inputProps, submit, isValid } =
    useForm<BulkUpdateTransactionFormData>(
      {
        description: "",
        categoryUpdateMode: CategoryUpdateMode.REPLACE,
      },
      (data) => {
        if (data.description !== "" || selection.length > 0) {
          onBulkUpdateSubmit({
            ...(data.description !== ""
              ? {
                  description: data.description,
                }
              : {}),
            ...(selection.length > 0
              ? {
                  categoryIds: selection.map((category) => category.id),
                }
              : {}),
            categoryUpdateMode: data.categoryUpdateMode,
          })
        } else {
          props.onOpenChange(false)
        }
      },
    )

  const onDescriptionChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    inputProps("description", "").onChange(event.currentTarget.value)
  }

  function onBulkUpdateSubmit(data: BulkUpdateTransactionsData): void {
    props.onBulkUpdate(data).then((didSucceed) => {
      if (didSucceed) {
        props.onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={props.isOpen} onClose={() => props.onOpenChange(false)}>
      <DialogContent>
        <Stack spacing={1.5}>
          <Typography variant="h5">Update transactions</Typography>
          <Form
            onSubmit={submit}
            networkResponse={categories}
            submitButtonLabel="Save"
            cancelAction={() => props.onOpenChange(false)}
            isValid={isValid}
          >
            <TextField
              label="Description"
              value={inputProps("description", "").value}
              onChange={onDescriptionChange}
            />
            <CategorySelect
              creatable
              multiple
              categories={categories}
              searchQuery={searchQuery}
              onSearchQueryChange={onSearchQueryChange}
              selection={selection}
              onSelectionChange={onSelectionChange}
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
