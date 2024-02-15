import * as S from "@effect/schema/Schema"
import { Dialog, DialogContent, Stack, Typography } from "@mui/material"
import { NetworkResponse } from "../../network/NetworkResponse"
import { TransactionWithCategories, UpdateTransactionsInput } from "./domain"
import { useForm } from "../../hooks/useForm"
import Form from "../forms/Form"
import ValidatedSelect from "../forms/inputs/ValidatedSelect"
import TextInput from "../forms/inputs/TextInput"
import { useCommand, useLazyQuery } from "../../hooks/network"
import { insertCategoryRequest, listCategoriesRequest } from "../categories/api"
import { useEffect, useState } from "react"
import { useDebounce } from "../../hooks/useDebounce"
import { Category } from "../categories/domain"
import CategorySelect, {
  MultipleCategoriesSelection,
} from "../forms/inputs/CategorySelect"
import { Either, pipe } from "effect"
import { constVoid } from "effect/Function"

interface Props {
  isOpen: boolean
  onClose(): void
  updateNetworkResponse: NetworkResponse<readonly TransactionWithCategories[]>
  onUpdate(data: Omit<UpdateTransactionsInput, "ids">): Promise<boolean>
}

export default function BulkUpdateTransactionsDialog(props: Props) {
  const [categoriesSearchQuery, setCategoriesSearchQuery] = useState("")
  const [categories, fetchCategories] = useLazyQuery(listCategoriesRequest)
  const [, insertCategory] = useCommand(insertCategoryRequest)
  const debounceFetchCategories = useDebounce(fetchCategories, 500)

  const { inputProps, submit, isValid } = useForm({
    initialValues: {
      description: "",
      categoryUpdateMode: "replace",
      categories: [],
    },
    validators: {
      description: S.Trim,
      categoryUpdateMode: S.literal("add", "replace"),
      categories: S.array(Category),
    },
    submit: (data) => {
      if (data.description !== "" || data.categories.length > 0) {
        props
          .onUpdate({
            ...(data.description !== ""
              ? {
                  description: data.description,
                }
              : {}),
            ...(data.categories.length > 0
              ? {
                  categories_ids: data.categories.map(
                    (category) => category.id,
                  ),
                  categories_mode: data.categoryUpdateMode,
                }
              : {}),
          })
          .then((result) => {
            if (result) {
              props.onClose()
            }
          })
      } else {
        props.onClose()
      }
    },
  })

  function onCategoriesSearchQueryChange(query: string) {
    setCategoriesSearchQuery(query)

    debounceFetchCategories({
      query: {
        direction: "forward",
        count: 10,
        ...(query === "" ? {} : { search_query: query }),
      },
    })
  }

  async function onCategoriesChange(
    selection: MultipleCategoriesSelection,
  ): Promise<void> {
    const responses = await Promise.all(
      selection.additions.map((body) => insertCategory({ body })),
    )

    pipe(
      responses,
      Either.all,
      Either.match({
        onLeft: constVoid,
        onRight: (categories) => {
          inputProps("categories").onChange([
            ...categories,
            ...selection.categories,
          ])
        },
      }),
    )
  }

  useEffect(() => {
    if (props.isOpen && categories.isIdle()) {
      fetchCategories({
        query: {
          direction: "forward",
          count: 10,
        },
      })
    }
  }, [props.isOpen, categories, fetchCategories])

  return (
    <Dialog open={props.isOpen} onClose={props.onClose}>
      <DialogContent>
        <Stack spacing={1.5}>
          <Typography variant="h5">Update transactions</Typography>
          <Form
            onSubmit={submit}
            networkResponse={props.updateNetworkResponse}
            submitButtonLabel="Save"
            cancelAction={props.onClose}
            isValid={isValid}
          >
            <TextInput {...inputProps("description")} label="Description" />
            <CategorySelect
              creatable
              multiple
              categories={categories}
              searchQuery={categoriesSearchQuery}
              onSearchQueryChange={onCategoriesSearchQueryChange}
              selection={inputProps("categories").value}
              onSelectionChange={onCategoriesChange}
            />
            <ValidatedSelect
              label="Categories update mode"
              {...inputProps("categoryUpdateMode")}
              options={{
                add: "Add categories",
                replace: "Replace categories",
              }}
            />
          </Form>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
