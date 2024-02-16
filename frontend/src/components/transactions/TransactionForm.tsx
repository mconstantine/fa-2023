import * as S from "@effect/schema/Schema"
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers"
import { useForm } from "../../hooks/useForm"
import { NetworkResponse } from "../../network/NetworkResponse"
import Form from "../forms/Form"
import { TransactionWithCategories } from "./domain"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import dayjs, { Dayjs } from "dayjs"
import { FormControl, FormHelperText, Stack, Typography } from "@mui/material"
import { useCommand, useLazyQuery } from "../../hooks/network"
import CategorySelect, {
  MultipleCategoriesSelection,
} from "../forms/inputs/CategorySelect"
import { insertCategoryRequest, listCategoriesRequest } from "../categories/api"
import { Either, Option, pipe } from "effect"
import { constNull, constTrue, constVoid } from "effect/Function"
import TextInput from "../forms/inputs/TextInput"
import { InsertTransactionInput } from "../../../../backend/src/database/functions/transaction/domain"
import { useState } from "react"
import { useDebounce } from "../../hooks/useDebounce"

interface Props {
  isVisible: boolean
  transaction: Option.Option<TransactionWithCategories>
  networkResponse: NetworkResponse<TransactionWithCategories>
  onSubmit(data: InsertTransactionInput): void
  onCancel(): void
}

export default function TransactionForm(props: Props) {
  const [categories, fetchCategories] = useLazyQuery(listCategoriesRequest)
  const [newCategory, insertCategory] = useCommand(insertCategoryRequest)
  const [listCategoriesSearchQuery, setListCategoriesSearchQuery] = useState("")
  const debounceFetchCategories = useDebounce(fetchCategories, 500)

  const { inputProps, submit, isValid } = useForm({
    initialValues: {
      date: pipe(
        props.transaction,
        Option.map((t) => t.date),
        Option.getOrElse(() => new Date()),
      ),
      description: pipe(
        props.transaction,
        Option.map((t) => t.description),
        Option.getOrElse(() => ""),
      ),
      value: pipe(
        props.transaction,
        Option.map((t) => t.value),
        Option.getOrElse(() => 0),
      ),
      categories: pipe(
        props.transaction,
        Option.map((t) => t.categories),
        Option.getOrElse(() => []),
      ),
    },
    validators: {
      date: S.Date.pipe(S.filter(constTrue, { message: () => "Invalid date" })),
      description: S.Trim.pipe(
        S.nonEmpty({ message: () => "Description cannot be empty" }),
      ),
      value: S.NumberFromString.pipe(
        S.filter(constTrue, { message: () => "This should be a number" }),
      ),
    },
    submit: (data) =>
      props.onSubmit({
        ...data,
        categories_ids: data.categories.map((category) => category.id),
      }),
  })

  const title = pipe(
    props.transaction,
    Option.map((t) => t.description),
    Option.getOrElse(() => "New transaction"),
  )

  const submitButtonLabel = pipe(
    props.transaction,
    Option.match({
      onNone: () => "Create",
      onSome: () => "Save",
    }),
  )

  const formNetworkResponse = props.networkResponse.flatMap(() => newCategory)

  function onDateChange(date: Dayjs | null): void {
    if (date !== null && date.isValid()) {
      inputProps("date").onChange(date.toISOString())
    } else {
      inputProps("date").onChange("")
    }
  }

  function onListCategoriesSearchQueryChange(query: string) {
    setListCategoriesSearchQuery(query)

    debounceFetchCategories({
      query: {
        direction: "forward",
        count: 10,
        ...(query === "" ? {} : { search_query: query }),
      },
    })
  }

  async function onCategorySelectionChange(
    selection: MultipleCategoriesSelection,
  ): Promise<void> {
    const newCategories = await Promise.all(
      selection.additions.map((body) => insertCategory({ body })),
    )

    pipe(
      newCategories,
      Either.all,
      Either.match({
        onLeft: constVoid,
        onRight: (categories) =>
          inputProps("categories").onChange([
            ...categories,
            ...selection.categories,
          ]),
      }),
    )
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h6">{title}</Typography>

      <Form
        networkResponse={formNetworkResponse}
        onSubmit={submit}
        isValid={isValid}
        cancelAction={props.onCancel}
        submitButtonLabel={submitButtonLabel}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <FormControl>
            <DatePicker
              label="Date"
              value={dayjs(inputProps("date").value)}
              onChange={onDateChange}
            />
            {pipe(
              inputProps("date").error,
              Option.match({
                onNone: constNull,
                onSome: (error) => (
                  <FormHelperText error>{error}</FormHelperText>
                ),
              }),
            )}
          </FormControl>
        </LocalizationProvider>
        <TextInput label="Description" {...inputProps("description")} />
        <TextInput label="Value" {...inputProps("value")} />
        <CategorySelect
          multiple
          creatable
          categories={categories}
          searchQuery={listCategoriesSearchQuery}
          onSearchQueryChange={onListCategoriesSearchQueryChange}
          selection={inputProps("categories").value}
          onSelectionChange={onCategorySelectionChange}
        />
      </Form>
    </Stack>
  )
}
