import { TextFieldProps } from "@mui/material"
import { InputProps } from "../../../hooks/useForm"
import TextInput from "./TextInput"

interface Props extends InputProps<string> {
  label?: string | undefined
  fieldProps?: TextFieldProps
}

export default function NonBlankInput(props: Props) {
  return <TextInput fieldProps={props.fieldProps ?? {}} {...props} />
}
