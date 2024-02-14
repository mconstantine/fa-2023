import { TextField, TextFieldProps } from "@mui/material"
import { InputProps } from "../../../hooks/useForm"
import { Option, pipe } from "effect"

interface Props extends InputProps<unknown, string> {
  label: string
  fieldProps?: TextFieldProps
}

export default function TextInput(props: Props) {
  return (
    <TextField
      {...(props.fieldProps ?? {})}
      size="small"
      variant="filled"
      id={props.name}
      name={props.name}
      label={props.label}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      error={pipe(props.error, Option.isSome)}
      helperText={pipe(props.error, Option.getOrUndefined)}
    />
  )
}
