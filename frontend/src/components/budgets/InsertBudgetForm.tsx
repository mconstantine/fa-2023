import * as NetworkResponse from "../../network/NetworkResponse"
import * as paginationResponse from "../../network/PaginationResponse"
import * as S from "@effect/schema/Schema"
import { Stack, Typography } from "@mui/material"
import { useForm } from "../../hooks/useForm"
import Form from "../forms/Form"
import CategorySelect, {
  CategorySelection,
} from "../forms/inputs/CategorySelect"
import { Category } from "../categories/domain"
import { HttpError, useCommand, useLazyQuery } from "../../hooks/network"
import { InsertBudgetInput } from "./domain"
import { insertCategoryRequest, listCategoriesRequest } from "../categories/api"
import { constTrue, constVoid, pipe } from "effect/Function"
import { useState } from "react"
import { useDebounce } from "../../hooks/useDebounce"
import TextInput from "../forms/inputs/TextInput"
import { Either } from "effect"

interface Props {
  year: number
  excludedCategoriesIds: Array<string | null>
  networkResponse: NetworkResponse.NetworkResponse<HttpError, unknown>
  onSubmit(budget: InsertBudgetInput): void
  onCancel(): void
}

export default function InsertBudgetForm(props: Props) {
  const [categories, fetchCategories] = useLazyQuery(listCategoriesRequest)
  const [newCategory, insertCategory] = useCommand(insertCategoryRequest)
  const [searchQuery, setSearchQuery] = useState("")
  const debounceFetchCategories = useDebounce(fetchCategories, 500)

  const { inputProps, submit, isValid } = useForm({
    initialValues: {
      year: props.year,
      value: 0,
      selection: null,
    },
    validators: {
      value: S.NumberFromString.pipe(
        S.filter(constTrue, { message: () => "The value should be a number" }),
      ),
      selection: Category,
    },
    submit: (data) => {
      console.log("TODO:", { data })
      // props.onSubmit({ ...data, category_id: data.selection[0]?.id ?? null })
    },
  })

  const availableCategories = pipe(
    categories,
    NetworkResponse.map((categories) =>
      pipe(
        paginationResponse
          .getNodes(categories)
          .filter(
            (category) => !props.excludedCategoriesIds.includes(category.id),
          ),
        paginationResponse.fromNodes,
      ),
    ),
  )

  function onSearchQueryChange(searchQuery: string): void {
    setSearchQuery(searchQuery)

    debounceFetchCategories({
      query: {
        direction: "forward",
        count: 10,
        ...(searchQuery === "" ? {} : { search_query: searchQuery }),
      },
    })
  }

  async function onSelectionChange(
    selection: CategorySelection,
  ): Promise<void> {
    // inputProps("selection").onChange
    if (!("id" in selection)) {
      const response = await insertCategory({ body: selection })

      return pipe(
        response,
        Either.match({
          onLeft: constVoid,
          onRight: (category) => {
            inputProps("selection").onChange(category)
          },
        }),
      )
    } else {
      inputProps("selection").onChange(selection)
    }
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Create prediction</Typography>
      <Form
        onSubmit={submit}
        isValid={isValid}
        networkResponse={pipe(
          props.networkResponse,
          NetworkResponse.withErrorFrom(newCategory),
        )}
        submitButtonLabel="Save"
        cancelAction={props.onCancel}
      >
        <CategorySelect
          multiple={false}
          creatable
          categories={availableCategories}
          searchQuery={searchQuery}
          onSearchQueryChange={onSearchQueryChange}
          selection={inputProps("selection").value}
          onSelectionChange={onSelectionChange}
        />

        <TextInput {...inputProps("value")} label="Value" />
      </Form>
    </Stack>
  )
}
