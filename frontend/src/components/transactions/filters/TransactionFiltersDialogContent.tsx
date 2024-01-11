import {
  Box,
  Button,
  FormControlLabel,
  InputAdornment,
  Paper,
  Radio,
  Stack,
  Typography,
} from "@mui/material"
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import { FindTransactionsParams } from "../domain"
import dayjs, { Dayjs } from "dayjs"
import { NetworkResponse } from "../../../network/NetworkResponse"
import PositiveIntegerInput from "../../forms/inputs/PositiveIntegerInput"
import ValidatedSelect from "../../forms/inputs/ValidatedSelect"
import { useState } from "react"
import { DateTimeRange, RelativeTimeRange, ShortcutRange } from "./TimeRange"

interface Props {
  params: FindTransactionsParams
  onChange(params: FindTransactionsParams): void
  networkResponse: NetworkResponse<unknown>
}

type Mode = "RelativeTimeRange" | "DateRange"

interface TransactionFilters extends FindTransactionsParams {
  mode: Mode
}

export default function TransactionFiltersDialogContent(props: Props) {
  const [filters, setFilters] = useState<TransactionFilters>({
    ...props.params,
    mode: "RelativeTimeRange",
  })

  const datesAreValid =
    typeof filters.startDate !== "undefined" &&
    typeof filters.endDate !== "undefined" &&
    filters.startDate.localeCompare(filters.endDate) <= 0

  function onModeChange(mode: Mode) {
    setFilters((filters) => ({ ...filters, mode }))
  }

  function onDatesChange(startDate: Date, endDate: Date): void {
    setFilters((filters) => ({
      ...filters,
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
    }))
  }

  return (
    <Stack spacing={3}>
      <RelativeTimeRangeForm
        startDate={filters.startDate ? new Date(filters.startDate) : null}
        endDate={filters.endDate ? new Date(filters.endDate) : null}
        onChange={onDatesChange}
        disabled={filters.mode !== "RelativeTimeRange"}
        onEnable={() => onModeChange("RelativeTimeRange")}
      />
      <DateRangeForm
        startDate={filters.startDate ? new Date(filters.startDate) : null}
        endDate={filters.endDate ? new Date(filters.endDate) : null}
        isValid={datesAreValid}
        onChange={onDatesChange}
        disabled={filters.mode !== "DateRange"}
        onEnable={() => onModeChange("DateRange")}
      />
      <Box>
        <Button
          variant="contained"
          onClick={() => props.onChange(filters)}
          disabled={!datesAreValid || props.networkResponse.isLoading()}
        >
          Set filters
        </Button>
      </Box>
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
