import { NonNegativeNumberFromString } from "../validators"
import { TextFieldProps } from "@mui/material"
import ValidatedInput from "./ValidatedInput"

interface Props {
  name: string
  label?: string
  value: number | null
  onChange(value: number): void
  errorMessage: string
  fieldProps?: TextFieldProps
}

export default function NonNegativeNumberInput(props: Props) {
  const validator = NonNegativeNumberFromString.withErrorMessage(
    props.errorMessage,
  )

  const value: string | null =
    props.value === null ? null : props.value.toString(10)

  function onChange(validatedValue: string) {
    props.onChange(parseInt(validatedValue))
  }

  return (
    <ValidatedInput
      {...props}
      value={value}
      onChange={onChange}
      validator={validator}
    />
  )
}
