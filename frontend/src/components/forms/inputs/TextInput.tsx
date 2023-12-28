import { TextField, TextFieldProps } from "@mui/material"
import { InputProps } from "../validators"

export default function TextInput(
  props: InputProps<string> & { fieldProps?: TextFieldProps },
) {
  const isInvalid = props.type === "invalid"

  const errorMessage: string | null = (() => {
    switch (props.type) {
      case "untouched":
        return null
      case "valid":
        return null
      case "invalid":
        return props.error
    }
  })()

  return (
    <TextField
      {...(props.fieldProps ?? {})}
      size="small"
      variant="filled"
      id={props.name}
      name={props.name}
      label={props.label}
      value={props.input}
      onChange={(e) => props.onChange(e.target.value)}
      error={isInvalid}
      helperText={errorMessage}
    />
  )
}
