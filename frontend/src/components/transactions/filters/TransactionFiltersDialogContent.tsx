import * as S from "@effect/schema/Schema"
import {
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputAdornment,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material"
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import dayjs, { Dayjs } from "dayjs"
import { NetworkResponse } from "../../../network/NetworkResponse"
import PositiveIntegerInput from "../../forms/inputs/PositiveIntegerInput"
import ValidatedSelect from "../../forms/inputs/ValidatedSelect"
import { useState } from "react"
import { DateTimeRange, RelativeTimeRange, ShortcutRange } from "./TimeRange"
import CategorySelect from "../../forms/inputs/CategorySelect"
import { Category } from "../../categories/domain"
import { PaginationResponse as PaginationResponseType } from "../../../globalDomain"
import { PaginationResponse } from "../../../network/PaginationResponse"
import { Option, pipe } from "effect"
import { constVoid } from "effect/Function"
import { ListTransactionsInput, TransactionWithCategories } from "../domain"

interface Props {
  filters: ListTransactionsInput
  onFiltersChange(filters: ListTransactionsInput): void
  listTransactionsResponse: NetworkResponse<
    PaginationResponseType<TransactionWithCategories>
  >
  listCategoriesResponse: NetworkResponse<PaginationResponseType<Category>>
  categoriesSearchQuery: string
  onCategoriesSearchQueryChange(query: string): void
  onCancel(): void
}

type Mode = "RelativeTimeRange" | "DateRange"

type TransactionFilters = Omit<ListTransactionsInput, "categories_ids"> & {
  mode: Mode
  categories_ids: readonly string[]
}

export default function TransactionFiltersDialogContent(props: Props) {
  const [filters, setFilters] = useState<TransactionFilters>({
    ...props.filters,
    mode: "RelativeTimeRange",
    categories_ids:
      "categories_ids" in props.filters ? props.filters.categories_ids : [],
  })

  const [categoriesSelection, setCategoriesSelection] = useState<Category[]>([])

  const datesAreValid =
    filters.date_since
      .toISOString()
      .localeCompare(filters.date_until.toISOString()) <= 0

  const categoriesAreValid =
    filters.categories !== "specific" || filters.categories_ids.length > 0

  const submitIsDisabled =
    !datesAreValid ||
    !categoriesAreValid ||
    props.listTransactionsResponse.isLoading()

  function onTimeRangeModeChange(mode: Mode) {
    setFilters((filters) => ({ ...filters, mode }))
  }

  function onDatesChange(startDate: Date, endDate: Date): void {
    setFilters((filters) => ({
      ...filters,
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
    }))
  }

  function onCategoryModeChange(
    categories: ListTransactionsInput["categories"],
  ): void {
    switch (categories) {
      case "all":
      case "uncategorized":
        return setFilters((filters) => ({
          ...filters,
          categoryMode: categories,
        }))
      case "specific":
        return setFilters((filters) => ({
          ...filters,
          categories,
          categories_ids: categoriesSelection.map((category) => category.id),
        }))
    }
  }

  function onCategoriesSelectionChange(selection: Category[]): void {
    setCategoriesSelection(selection)

    setFilters((filters) => ({
      ...filters,
      categories_ids: selection.map((category) => category.id),
    }))
  }

  return (
    <Stack spacing={3}>
      <RelativeTimeRangeForm
        startDate={filters.date_since ? new Date(filters.date_since) : null}
        endDate={filters.date_until ? new Date(filters.date_until) : null}
        onChange={onDatesChange}
        disabled={filters.mode !== "RelativeTimeRange"}
        onEnable={() => onTimeRangeModeChange("RelativeTimeRange")}
      />
      <DateRangeForm
        startDate={filters.date_since ? new Date(filters.date_since) : null}
        endDate={filters.date_until ? new Date(filters.date_until) : null}
        isValid={datesAreValid}
        onChange={onDatesChange}
        disabled={filters.mode !== "DateRange"}
        onEnable={() => onTimeRangeModeChange("DateRange")}
      />
      {(() => {
        switch (filters.categories) {
          case "all":
          case "uncategorized":
            return (
              <CategoriesFiltersForm
                mode={filters.categories}
                onModeChange={onCategoryModeChange}
              />
            )
          case "specific":
            return (
              <CategoriesFiltersForm
                mode={filters.categories}
                onModeChange={onCategoryModeChange}
                networkResponse={props.listCategoriesResponse}
                searchQuery={props.categoriesSearchQuery}
                onSearchQueryChange={props.onCategoriesSearchQueryChange}
                categories={categoriesSelection}
                onSelectionChange={onCategoriesSelectionChange}
              />
            )
        }
      })()}
      <Stack direction="row" spacing={1.5}>
        <Button
          variant="contained"
          onClick={() => {
            switch (filters.categories) {
              case "all":
              case "uncategorized":
                return props.onFiltersChange(filters)
              case "specific":
                return pipe(
                  filters.categories_ids,
                  S.decodeUnknownOption(S.nonEmptyArray(S.UUID)),
                  Option.match({
                    onNone: constVoid,
                    onSome: (categories_ids) =>
                      props.onFiltersChange({ ...filters, categories_ids }),
                  }),
                )
            }
          }}
          disabled={submitIsDisabled}
        >
          Set filters
        </Button>
        <Button color="inherit" onClick={() => props.onCancel()}>
          Cancel
        </Button>
      </Stack>
    </Stack>
  )
}

interface RangeFormProps {
  startDate: Date | null
  endDate: Date | null
  onChange(startDate: Date, endDate: Date): void
  disabled: boolean
  onEnable(): void
}

function RelativeTimeRangeForm(props: RangeFormProps) {
  const value: RelativeTimeRange = (() => {
    if (props.startDate !== null && props.endDate !== null) {
      const dateTimeRange = new DateTimeRange(props.startDate, props.endDate)
      const relativeTimeRange =
        RelativeTimeRange.fromDateTimeRange(dateTimeRange)

      if (relativeTimeRange !== null) {
        return relativeTimeRange
      }
    }

    return new RelativeTimeRange(1, ShortcutRange.YEARS)
  })()

  function onRangeNumberChange(last: number): void {
    const relativeTimeRange = new RelativeTimeRange(last, value.range)
    const dateTimeRange = relativeTimeRange.toDateTimeRange()

    props.onChange(dateTimeRange.startDate, dateTimeRange.endDate)
  }

  function onRangeChange(range: ShortcutRange): void {
    const relativeTimeRange = new RelativeTimeRange(value.last, range)
    const dateTimeRange = relativeTimeRange.toDateTimeRange()

    props.onChange(dateTimeRange.startDate, dateTimeRange.endDate)
  }

  return (
    <Paper sx={{ p: 1.5 }}>
      <Stack spacing={1.5}>
        <FormControlLabel
          control={<Radio />}
          label="By relative time range"
          checked={!props.disabled}
          onClick={() => props.onEnable()}
        />
        <Stack direction="row" spacing={1.5} alignItems="center">
          <PositiveIntegerInput
            name="last"
            value={value.last}
            onChange={onRangeNumberChange}
            errorMessage="This should be a positive integer"
            fieldProps={{
              InputProps: {
                startAdornment: (
                  <InputAdornment position="start">Last</InputAdornment>
                ),
              },
              disabled: props.disabled,
            }}
          />
          <ValidatedSelect
            name="range"
            value={value.range}
            onChange={onRangeChange}
            options={ShortcutRange}
          />
        </Stack>
      </Stack>
    </Paper>
  )
}

interface DateRangeFormProps extends RangeFormProps {
  isValid: boolean
}

function DateRangeForm(props: DateRangeFormProps) {
  function onStartDateChange(startDate: Dayjs | null): void {
    if (startDate !== null && startDate.isValid() && props.endDate !== null) {
      props.onChange(startDate.toDate(), props.endDate)
    }
  }

  function onEndDateChange(endDate: Dayjs | null): void {
    if (endDate !== null && endDate.isValid() && props.startDate !== null) {
      props.onChange(props.startDate, endDate.toDate())
    }
  }

  return (
    <Paper sx={{ p: 1.5 }}>
      <Stack spacing={1.5}>
        <FormControlLabel
          control={<Radio />}
          label="By date range"
          checked={!props.disabled}
          onClick={() => props.onEnable()}
        />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Stack spacing={1.5}>
            <DatePicker
              label="Start date"
              value={dayjs(props.startDate)}
              onChange={onStartDateChange}
              disabled={props.disabled}
              disableFuture
            />
            <DatePicker
              label="End date"
              value={dayjs(props.endDate)}
              onChange={onEndDateChange}
              disabled={props.disabled}
              disableFuture
            />
            {props.isValid ? null : (
              <Typography variant="caption" color="error">
                End date should come after start date
              </Typography>
            )}
          </Stack>
        </LocalizationProvider>
      </Stack>
    </Paper>
  )
}

interface BaseCategoriesFiltersProps {
  onModeChange(categories: ListTransactionsInput["categories"]): void
}

interface SpecificCategoriesFiltersFormProps
  extends BaseCategoriesFiltersProps {
  mode: "specific"
  networkResponse: NetworkResponse<PaginationResponseType<Category>>
  categories: Category[]
  searchQuery: string
  onSearchQueryChange(query: string): void
  onSelectionChange(selection: Category[]): void
}

interface NonSpecificCategoryFiltersFormProps
  extends BaseCategoriesFiltersProps {
  mode: "all" | "uncategorized"
}

type CategoriesFiltersFormProps =
  | SpecificCategoriesFiltersFormProps
  | NonSpecificCategoryFiltersFormProps

function CategoriesFiltersForm(props: CategoriesFiltersFormProps) {
  return (
    <Paper sx={{ p: 1.5 }}>
      <Stack spacing={3}>
        <FormControl>
          <FormLabel id="categories-filter-label">Filter categories</FormLabel>
          <RadioGroup
            aria-labelledby="categories-filter-label"
            name="categories-filter"
            value={props.mode}
            onChange={(_, value) =>
              props.onModeChange(value as ListTransactionsInput["categories"])
            }
          >
            <FormControlLabel
              value="all"
              control={<Radio />}
              label="All categories"
            />
            <FormControlLabel
              value="uncategorized"
              control={<Radio />}
              label="Uncategorized only"
            />
            <FormControlLabel
              value="specific"
              control={<Radio />}
              label="Choose specific categories"
            />
          </RadioGroup>
        </FormControl>

        {props.mode === "specific" ? <CategorySelectForm {...props} /> : null}
      </Stack>
    </Paper>
  )
}

function CategorySelectForm(props: SpecificCategoriesFiltersFormProps) {
  return (
    <CategorySelect
      creatable={false}
      multiple
      categories={props.networkResponse.map((response) =>
        PaginationResponse.of(response).getNodes(),
      )}
      searchQuery={props.searchQuery}
      onSearchQueryChange={props.onSearchQueryChange}
      selection={props.categories}
      onSelectionChange={props.onSelectionChange}
    />
  )
}
