import { InputProps, NonBlankString } from "../validators"
import { useEffect, useState } from "react"
import TextInput from "./TextInput"
import { TextFieldProps } from "@mui/material"

interface Props {
  name: string
  label: string
  value: string | null
  onChange(value: string): void
  errorMessageWhenBlank: string
  fieldProps?: TextFieldProps
}

export default function NonBlankInput(props: Props) {
  const [inputProps, setInputProps] = useState<InputProps<string>>({
    type: "untouched",
    name: props.name,
    label: props.label,
    validator: NonBlankString.withErrorMessage(props.errorMessageWhenBlank),
    input: props.value ?? "",
    onChange,
  })

  const { onChange: propsOnChange, value: propsValue } = props

  useEffect(() => {
    if (inputProps.type === "valid") {
      propsOnChange(inputProps.value)
    }
  }, [inputProps, propsOnChange])

  useEffect(() => {
    if (propsValue === null) {
      setInputProps((inputProps) => ({
        ...inputProps,
        type: "untouched",
        input: "",
      }))
    }
  }, [propsValue])

  function onChange(input: string) {
    setInputProps((inputProps) => {
      const validation = inputProps.validator.validate(input)

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
  }

  return <TextInput fieldProps={props.fieldProps ?? {}} {...inputProps} />
}
