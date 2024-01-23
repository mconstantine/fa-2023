import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers"
import { useForm } from "../../hooks/useForm"
import { networkResponse } from "../../network/NetworkResponse"
import {
  Category,
  CategoryBulkCreationBody,
  CategoryCreationBody,
  FindCategoryParams,
} from "../categories/domain"
import Form from "../forms/Form"
import NonBlankInput from "../forms/inputs/NonBlankInput"
import { Transaction, TransactionCreationBody } from "./domain"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import dayjs, { Dayjs } from "dayjs"
import NumberInput from "../forms/inputs/NumberInput"
import { useCategorySelect } from "../../hooks/useCategorySelect"
import { Stack, Typography } from "@mui/material"
import { useCommand, useLazyQuery } from "../../hooks/network"
import CategorySelect from "../forms/inputs/CategorySelect"

interface Props {
  isVisible: boolean
  isLoading: boolean
  transaction: Transaction | null
  onSubmit(data: TransactionCreationBody): void
  onCancel(): void
}

interface FormData extends Record<string, unknown> {
  date: Date
  description: string
  value: number
  categories: Category[]
}

export default function TransactionForm(props: Props) {
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
  } = useCategorySelect(
    props.isVisible,
    true,
    true,
    props.transaction?.categories ?? [],
    categoriesQuery,
    createCategoryCommand,
    bulkCreateCategoriesCommand,
  )

  const { inputProps, submit, isValid } = useForm<FormData>(
    {
      date: props.transaction?.date
        ? new Date(props.transaction.date)
        : new Date(),
      description: props.transaction?.description ?? "",
      value: props.transaction?.value ?? 0,
      categories: props.transaction?.categories ?? [],
    },
    (data) =>
      props.onSubmit({
        ...data,
        date: data.date.toISOString(),
        categoryIds: data.categories.map((category) => category.id),
      }),
  )

  const title = props.transaction?.description ?? "New transaction"
  const submitButtonLabel = props.transaction !== null ? "Save" : "Create"

  function onDateChange(date: Dayjs | null): void {
    if (date !== null && date.isValid()) {
      inputProps("date", new Date()).onChange(date.toDate())
    }
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h6">{title}</Typography>

      <Form
        // TODO:
        networkResponse={networkResponse.make()}
        onSubmit={submit}
        isValid={isValid}
        cancelAction={props.onCancel}
        submitButtonLabel={submitButtonLabel}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Date"
            value={dayjs(inputProps("date", new Date()).value)}
            onChange={onDateChange}
          />
        </LocalizationProvider>
        <NonBlankInput
          label="Description"
          {...inputProps("description", null)}
          errorMessageWhenBlank="A transaction description cannot be blank"
        />
        <NumberInput
          label="Value"
          errorMessage="A transaction value should be a number"
          {...inputProps("value", 0)}
        />
        <CategorySelect
          multiple
          creatable
          categories={categories}
          searchQuery={searchQuery}
          onSearchQueryChange={onSearchQueryChange}
          selection={selection}
          onSelectionChange={onSelectionChange}
        />
      </Form>
    </Stack>
  )
}
