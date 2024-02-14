import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  SxProps,
  Theme,
} from "@mui/material"
import { InputProps } from "../../../hooks/useForm"
import { Option, pipe } from "effect"
import { constNull } from "effect/Function"

interface Props<T extends Record<string, string>>
  extends InputProps<keyof T, string> {
  options: T
  label?: string
  sx?: SxProps<Theme>
}

export default function ValidatedSelect<T extends Record<string, string>>(
  props: Props<T>,
) {
  function onChange(event: SelectChangeEvent<string | null>): void {
    const value = event.target.value

    if (value !== null) {
      props.onChange(value)
    }
  }

  return (
    <FormControl {...(props.sx ? { sx: props.sx } : {})}>
      {typeof props.label !== "undefined" ? (
        <InputLabel>{props.label}</InputLabel>
      ) : null}
      <Select
        id={props.name}
        name={props.name}
        value={props.value}
        onChange={onChange}
        label={props.label}
      >
        {Object.entries(props.options).map(([key, value]) => (
          <MenuItem key={key} value={key}>
            {value}
          </MenuItem>
        ))}
      </Select>
      {pipe(
        props.error,
        Option.match({
          onNone: constNull,
          onSome: (error) => <FormHelperText error>{error}</FormHelperText>,
        }),
      )}
    </FormControl>
  )
}
