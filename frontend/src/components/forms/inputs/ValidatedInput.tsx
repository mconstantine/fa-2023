import { InputProps, ValidatorWithErrorMessage } from "../validators"
import { useEffect, useState } from "react"
import TextInput from "./TextInput"
import { TextFieldProps } from "@mui/material"

interface Props {
  name: string
  label?: string
  value: string | null
  onChange(value: string): void
  validator: ValidatorWithErrorMessage<string>
  fieldProps?: TextFieldProps
}

export default function ValidatedInput(props: Props) {
  const [inputProps, setInputProps] = useState<InputProps<string>>({
    type: "untouched",
    name: props.name,
    label: props.label,
    validator: props.validator,
    input: props.value ?? "",
    onChange,
  })

  useEffect(() => {
    setInputProps((inputProps) => ({
      ...inputProps,
      input: props.value ?? "",
    }))
  }, [props.value])

  function onChange(input: string) {
    const validation = inputProps.validator.validate(input)

    setInputProps((inputProps) => {
      return validation.match<InputProps<string>>(
        () => ({
          ...inputProps,
          input,
          type: "invalid",
          error: inputProps.validator.errorMessage,
        }),
        (value) => ({
          ...inputProps,
          input,
          type: "valid",
          value,
        }),
      )
    })

    if (validation.isSuccessful()) {
      props.onChange(input)
    }
  }

  return <TextInput fieldProps={props.fieldProps ?? {}} {...inputProps} />
}
