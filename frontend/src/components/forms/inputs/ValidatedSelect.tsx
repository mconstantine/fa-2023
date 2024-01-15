import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material"

interface Props<T extends Record<string, string>> {
  name: string
  value: T[string] | null
  options: T
  onChange(value: T[string]): void
  label?: string
  optionLabels?: { [key in keyof T]: string }
}

export default function ValidatedSelect<T extends Record<string, string>>(
  props: Props<T>,
) {
  function onChange(event: SelectChangeEvent<T[string] | null>): void {
    const value = event.target.value

    if (value !== null) {
      props.onChange(value as T[string])
    }
  }

  return (
    <FormControl>
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
          <MenuItem key={key} value={value}>
            {typeof props.optionLabels === "undefined"
              ? value
              : props.optionLabels[key]}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
