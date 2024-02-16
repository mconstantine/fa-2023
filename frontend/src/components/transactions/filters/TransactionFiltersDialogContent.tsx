import * as S from "@effect/schema/Schema"
import { NetworkResponse } from "../../../network/NetworkResponse"
import { Category } from "../../categories/domain"
import { PaginationResponse as PaginationResponseType } from "../../../globalDomain"
import { ListTransactionsInput, TransactionWithCategories } from "../domain"
import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  Paper,
  Radio,
  Stack,
  Typography,
} from "@mui/material"
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import { useForm } from "../../../hooks/useForm"
import Form from "../../forms/Form"
import dayjs, { Dayjs } from "dayjs"
import { Either, Option, pipe } from "effect"
import { constNull, constTrue, constVoid } from "effect/Function"
import { DateTimeRange, RelativeTimeRange } from "./TimeRange"
import TextInput from "../../forms/inputs/TextInput"
import ValidatedSelect from "../../forms/inputs/ValidatedSelect"
import CategorySelect from "../../forms/inputs/CategorySelect"
import { useLazyQuery } from "../../../hooks/network"
import { listCategoriesRequest } from "../../categories/api"
import { useState } from "react"
import { useDebounce } from "../../../hooks/useDebounce"
import { RelativeRange } from "./domain"

interface Props {
  filters: ListTransactionsInput
  onFiltersChange(filters: ListTransactionsInput): void
  listTransactionsResponse: PaginationResponseType<TransactionWithCategories>
  listCategoriesResponse: NetworkResponse<PaginationResponseType<Category>>
  categoriesSearchQuery: string
  onCategoriesSearchQueryChange(query: string): void
  onCancel(): void
}

export default function TransactionFiltersDialogContent(props: Props) {
  const { inputProps, validated, submit, isValid, formError } = useForm({
    initialValues: {
      timeRange: "RelativeTimeRange",
      dateSince: props.filters.date_since,
      dateUntil: props.filters.date_until,
      ...(() => {
        const relativeTimeRange = RelativeTimeRange.fromDateRange(
          new DateTimeRange(props.filters.date_since, props.filters.date_until),
        )

        return {
          relativeLast: relativeTimeRange.last,
          relativeRange: relativeTimeRange.range,
          relativeSince: relativeTimeRange.since,
        }
      })(),
      categoryMode: props.filters.categories,
      categories: [],
    },
    validators: {
      timeRange: S.literal("DateTimeRange", "RelativeTimeRange"),
      dateSince: S.Date.pipe(
        S.filter(constTrue, { message: () => "Invalid date" }),
      ).pipe(
        S.filter((date) => date.getTime() < Date.now(), {
          message: () => "Start date cannot be in the future",
        }),
      ),
      dateUntil: S.Date.pipe(
        S.filter(constTrue, { message: () => "Invalid date" }),
      ),
      relativeLast: S.NumberFromString.pipe(
        S.int({ message: () => "Last should be an integer" }),
      ).pipe(S.positive({ message: () => "Last should be positive" })),
      categories: S.array(Category),
    },
    formValidator: (data) => {
      if (
        data.dateSince
          .toISOString()
          .localeCompare(data.dateUntil.toISOString()) > 0
      ) {
        return Either.left("Start date should come before end date")
      } else {
        switch (data.categoryMode) {
          case "all":
          case "uncategorized":
            return Either.right(data)
          case "specific":
            return pipe(
              data.categories.map((category) => category.id),
              S.decodeEither(
                S.array(S.UUID).pipe(
                  S.minItems(1, {
                    message: () =>
                      "You should choose some categories if you want to filter by specific ones.",
                  }),
                ),
              ),
              Either.mapBoth({
                onLeft: (error) => error.message,
                onRight: (categories) => ({
                  ...data,
                  categories: categories as readonly [string, ...string[]],
                }),
              }),
            )
        }
      }
    },
    submit: (data) =>
      props.onFiltersChange({
        ...props.filters,
        date_since: data.dateSince,
        date_until: data.dateUntil,
        ...(() => {
          switch (data.categoryMode) {
            case "all":
            case "uncategorized":
              return { categories: data.categoryMode }
            case "specific":
              return {
                categories: "specific",
                categories_ids: data.categories as readonly [
                  string,
                  ...string[],
                ],
              }
          }
        })(),
      }),
  })

  const timeRangeProps = inputProps("timeRange")
  const dateSinceProps = inputProps("dateSince")
  const dateUntilProps = inputProps("dateUntil")
  const relativeLastProps = inputProps("relativeLast")
  const relativeRangeProps = inputProps("relativeRange")

  const [categories, fetchCategories] = useLazyQuery(listCategoriesRequest)
  const [categoriesSearchQuery, setCategoriesSearchQuery] = useState("")
  const debounceFetchCategories = useDebounce(fetchCategories, 500)

  function onDateSinceChange(value: Dayjs | null): void {
    if (value !== null && value.isValid()) {
      const dateSince = dateSinceProps.onChange(value.toISOString())

      pipe(
        dateSince,
        Either.match({
          onLeft: constVoid,
          onRight: (dateSince) => {
            const relativeTimeRange = RelativeTimeRange.fromDateRange(
              new DateTimeRange(dateSince, validated.dateUntil),
            )

            relativeLastProps.onChange(relativeTimeRange.last.toString(10))
            relativeRangeProps.onChange(relativeTimeRange.range)
          },
        }),
      )
    } else {
      dateSinceProps.onChange("")
    }
  }

  function onDateUntilChange(value: Dayjs | null): void {
    if (value !== null && value.isValid()) {
      const dateUntil = dateUntilProps.onChange(value.toISOString())

      pipe(
        dateUntil,
        Either.match({
          onLeft: constVoid,
          onRight: (dateUntil) => {
            const relativeTimeRange = RelativeTimeRange.fromDateRange(
              new DateTimeRange(validated.dateSince, dateUntil),
            )

            relativeLastProps.onChange(relativeTimeRange.last.toString(10))
            relativeRangeProps.onChange(relativeTimeRange.range)
          },
        }),
      )
    } else {
      dateUntilProps.onChange("")
    }
  }

  function onRelativeLastChange(value: string): Either.Either<string, number> {
    const last = relativeLastProps.onChange(value)

    pipe(
      last,
      Either.match({
        onLeft: constVoid,
        onRight: (last) => {
          const dateTimeRange = DateTimeRange.fromRelativeTimeRange(
            new RelativeTimeRange(
              last,
              relativeRangeProps.value,
              validated.dateUntil,
            ),
          )

          dateSinceProps.onChange(dateTimeRange.dateSince.toISOString())
        },
      }),
    )

    return last
  }

  function onRelativeRangeChange(
    value: RelativeRange,
  ): Either.Either<string, RelativeRange> {
    const range = relativeRangeProps.onChange(value)

    pipe(
      range,
      Either.match({
        onLeft: constVoid,
        onRight: (range) => {
          const dateTimeRange = DateTimeRange.fromRelativeTimeRange(
            new RelativeTimeRange(
              validated.relativeLast,
              range,
              validated.dateUntil,
            ),
          )

          dateSinceProps.onChange(dateTimeRange.dateSince.toISOString())
        },
      }),
    )

    return range
  }

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

  return (
    <Form
      onSubmit={submit}
      isValid={isValid}
      submitButtonLabel="Filter"
      cancelAction={props.onCancel}
      networkResponse={props.listCategoriesResponse}
      formError={formError}
    >
      <Paper sx={{ p: 1.5 }}>
        <Stack spacing={3}>
          <FormControlLabel
            control={<Radio />}
            label="By relative time range"
            checked={timeRangeProps.value === "RelativeTimeRange"}
            onClick={() => timeRangeProps.onChange("RelativeTimeRange")}
          />
          <Stack direction="row" spacing={1.5} alignItems="center">
            <TextInput
              {...relativeLastProps}
              onChange={onRelativeLastChange}
              label="Last"
              fieldProps={{
                disabled: timeRangeProps.value === "DateTimeRange",
              }}
            />
            <ValidatedSelect
              {...relativeRangeProps}
              onChange={onRelativeRangeChange}
              options={{
                days: "days",
                weeks: "weeks",
                months: "months",
                years: "years",
              }}
              disabled={timeRangeProps.value === "DateTimeRange"}
            />
          </Stack>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <FormControl>
              <DatePicker
                label="Since"
                value={dayjs(dateUntilProps.value)}
                onChange={onDateUntilChange}
                disabled={timeRangeProps.value === "DateTimeRange"}
              />
              {pipe(
                dateSinceProps.error,
                Option.match({
                  onNone: constNull,
                  onSome: (error) => (
                    <FormHelperText error>{error}</FormHelperText>
                  ),
                }),
              )}
            </FormControl>
          </LocalizationProvider>
        </Stack>
      </Paper>
      <Paper sx={{ p: 1.5 }}>
        <Stack spacing={3}>
          <FormControlLabel
            control={<Radio />}
            label="By date range"
            checked={timeRangeProps.value === "DateTimeRange"}
            onClick={() => timeRangeProps.onChange("DateTimeRange")}
          />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack spacing={3}>
              <FormControl>
                <DatePicker
                  label="Start date"
                  value={dayjs(dateSinceProps.value)}
                  onChange={onDateSinceChange}
                  disabled={timeRangeProps.value === "RelativeTimeRange"}
                  disableFuture
                />
                {pipe(
                  dateSinceProps.error,
                  Option.match({
                    onNone: constNull,
                    onSome: (error) => (
                      <FormHelperText error>{error}</FormHelperText>
                    ),
                  }),
                )}
              </FormControl>
              <FormControl>
                <DatePicker
                  label="End date"
                  value={dayjs(dateUntilProps.value)}
                  onChange={onDateUntilChange}
                  disabled={timeRangeProps.value === "RelativeTimeRange"}
                />
                {pipe(
                  dateUntilProps.error,
                  Option.match({
                    onNone: constNull,
                    onSome: (error) => (
                      <FormHelperText error>{error}</FormHelperText>
                    ),
                  }),
                )}
              </FormControl>
              {/* {props.isValid ? null : (
              <Typography variant="caption" color="error">
                End date should come after start date
              </Typography>
            )} */}
            </Stack>
          </LocalizationProvider>
        </Stack>
      </Paper>
      <Paper sx={{ p: 1.5 }}>
        <Stack spacing={3}>
          <Typography>Filter by categories</Typography>
          <ValidatedSelect
            {...inputProps("categoryMode")}
            options={{
              all: "All categories",
              uncategorized: "Uncategorized only",
              specific: "Specific categories",
            }}
          />
          {(() => {
            switch (inputProps("categoryMode").value) {
              case "all":
              case "uncategorized":
                return null
              case "specific":
                return (
                  <CategorySelect
                    creatable={false}
                    multiple
                    selection={inputProps("categories").value}
                    onSelectionChange={inputProps("categories").onChange}
                    categories={categories}
                    searchQuery={categoriesSearchQuery}
                    onSearchQueryChange={onCategoriesSearchQueryChange}
                  />
                )
            }
          })()}
        </Stack>
      </Paper>
    </Form>
  )
}
