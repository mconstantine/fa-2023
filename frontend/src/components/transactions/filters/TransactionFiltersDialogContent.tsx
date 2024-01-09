import {
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
import { useForm } from "../../../hooks/useForm"
import { NetworkResponse } from "../../../network/NetworkResponse"
import PositiveIntegerInput from "../../forms/inputs/PositiveIntegerInput"
import ValidatedSelect from "../../forms/inputs/ValidatedSelect"
import { useState } from "react"

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

  // TODO: there should be a button that disables if this is false
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
    </Stack>
  )
}

enum ShortcutRange {
  WEEKS = "weeks",
  MONTHS = "months",
  YEARS = "years",
}

interface Shortcut extends Record<string, unknown> {
  last: number
  range: ShortcutRange
}

interface RelativeTimeRangeFormProps {
  disabled: boolean
  onEnable(): void
}

// TODO: this shouldn't use useForm, it should communicate with the parent component
function RelativeTimeRangeForm(props: RelativeTimeRangeFormProps) {
  const { inputProps } = useForm<Shortcut>(
    {
      last: 1,
      range: ShortcutRange.YEARS,
    },
    (data) => console.log(data),
  )

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
            {...inputProps("last", null)}
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
            {...inputProps("range", null)}
            options={ShortcutRange}
          />
        </Stack>
      </Stack>
    </Paper>
  )
}

interface DateRangeFormProps {
  startDate: Date | null
  endDate: Date | null
  onChange(startDate: Date, endDate: Date): void
  isValid: boolean
  disabled: boolean
  onEnable(): void
}

function DateRangeForm(props: DateRangeFormProps) {
  function onStartDateChange(startDate: Dayjs | null): void {
    if (startDate !== null && props.endDate !== null) {
      props.onChange(startDate.toDate(), props.endDate)
    }
  }

  function onEndDateChange(endDate: Dayjs | null): void {
    if (endDate !== null && props.startDate !== null) {
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
            />
            <DatePicker
              label="End date"
              value={dayjs(props.endDate)}
              onChange={onEndDateChange}
              disabled={props.disabled}
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
