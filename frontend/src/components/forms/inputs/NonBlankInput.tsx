import { NonBlankString } from "../validators"
import { TextFieldProps } from "@mui/material"
import ValidatedInput from "./ValidatedInput"

interface Props {
  name: string
  label?: string | undefined
  value: string | null
  onChange(value: string): void
  errorMessageWhenBlank: string
  fieldProps?: TextFieldProps
}

export default function NonBlankInput(props: Props) {
  const validator = NonBlankString.withErrorMessage(props.errorMessageWhenBlank)
  return <ValidatedInput {...props} validator={validator} />
}
