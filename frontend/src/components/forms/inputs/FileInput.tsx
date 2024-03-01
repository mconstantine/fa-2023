import { Button, ButtonTypeMap, Stack, Typography } from "@mui/material"
import { FormEventHandler } from "react"
import { InputProps } from "../../../hooks/useForm"
import { Option, pipe } from "effect"
import { constNull } from "effect/Function"

interface Props extends InputProps<File, File | null> {
  label: string
  buttonProps?: ButtonTypeMap["props"]
}

export default function FileInput(props: Props) {
  const onInput: FormEventHandler<HTMLInputElement> = (e) => {
    const files = e.currentTarget.files

    if (files?.length === 1) {
      props.onChange(files.item(0)!)
    } else {
      props.onChange(null)
    }
  }

  return (
    <Stack spacing={1}>
      <Button
        variant="outlined"
        component="label"
        sx={{ width: "fit-content" }}
        color={pipe(
          props.error,
          Option.match({
            onNone: () => "primary",
            onSome: () => "error",
          }),
        )}
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
      {pipe(
        props.error,
        Option.map((error) => (
          <Typography sx={{ pl: 2 }} variant="body2" color="error">
            {error}
          </Typography>
        )),
        Option.getOrElse(constNull),
      )}
    </Stack>
  )
}
