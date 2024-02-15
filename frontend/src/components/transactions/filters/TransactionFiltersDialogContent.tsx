import * as S from "@effect/schema/Schema"
import {
  NetworkResponse,
  networkResponse,
} from "../../../network/NetworkResponse"
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

interface Props {
  filters: ListTransactionsInput
  onFiltersChange(filters: ListTransactionsInput): void
  listTransactionsResponse: PaginationResponseType<TransactionWithCategories>
  listCategoriesResponse: NetworkResponse<PaginationResponseType<Category>>
  categoriesSearchQuery: string
  onCategoriesSearchQueryChange(query: string): void
  onCancel(): void
}

export const RelativeRange = S.literal("days", "weeks", "months", "years")
export type RelativeRange = S.Schema.To<typeof RelativeRange>

export default function TransactionFiltersDialogContent(props: Props) {
  const { inputProps, validated, submit, isValid } = useForm({
    initialValues: {
      timeRange: "DateTimeRange",
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
    },
    formValidator: (data) => {
      if (
        data.dateSince
          .toISOString()
          .localeCompare(data.dateUntil.toISOString()) > 0
      ) {
        return Either.left("Start date should come before end date")
      } else {
        return Either.right(data)
      }
    },
    submit: console.log,
  })

  const timeRangeProps = inputProps("timeRange")
  const dateSinceProps = inputProps("dateSince")
  const dateUntilProps = inputProps("dateUntil")
  const relativeLastProps = inputProps("relativeLast")
  const relativeRangeProps = inputProps("relativeRange")

  function onDateSinceChange(value: Dayjs | null): void {
    if (value !== null) {
      try {
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
      } catch (e) {
        dateSinceProps.onChange("")
      }
    }
  }

  function onDateUntilChange(value: Dayjs | null): void {
    if (value !== null) {
      try {
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
      } catch (e) {
        dateUntilProps.onChange("")
      }
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

  return (
    <Form
      onSubmit={submit}
      isValid={isValid}
      submitButtonLabel="Filter"
      cancelAction={props.onCancel}
      // TODO:
      networkResponse={networkResponse.make()}
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
    </Form>
  )
}
