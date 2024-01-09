import { FormControl, MenuItem, Select, SelectChangeEvent } from "@mui/material"

interface Props<T extends Record<string, string>> {
  name: string
  value: T[string] | null
  options: T
  onChange(value: T[string]): void
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
      <Select
        id={props.name}
        name={props.name}
        value={props.value}
        onChange={onChange}
      >
        {Object.entries(props.options).map(([key, value]) => (
          <MenuItem key={key} value={value}>
            {value}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
