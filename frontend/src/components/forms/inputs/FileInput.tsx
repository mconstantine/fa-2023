import { Button, ButtonTypeMap } from "@mui/material"
import { FormEventHandler } from "react"

interface Props {
  name: string
  label: string
  value: File | null
  onChange(value: File): void
  buttonProps?: ButtonTypeMap["props"]
}

export default function FileInput(props: Props) {
  const onInput: FormEventHandler<HTMLInputElement> = (e) => {
    const files = e.currentTarget.files

    if (files?.length === 1) {
      props.onChange(files.item(0)!)
    }
  }

  return (
    <Button
      variant="outlined"
      component="label"
      sx={{ width: "fit-content" }}
      {...props.buttonProps}
    >
      {props.label}
      <input
        id={props.name}
        name={props.name}
        type="file"
        hidden
        onInput={onInput}
      />
    </Button>
  )
}
