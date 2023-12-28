import { Button } from "@mui/material"
import { FormEvent, PropsWithChildren } from "react"

interface Props {
  onSubmit(): void
  isValid(): boolean
  submitButtonLabel: string
}

export default function Form(props: PropsWithChildren<Props>) {
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    props.onSubmit()
  }

  return (
    <form onSubmit={onSubmit}>
      {props.children}
      <Button
        type="submit"
        variant="contained"
        sx={{ mt: 3 }}
        disabled={!props.isValid()}
      >
        {props.submitButtonLabel}
      </Button>
    </form>
  )
}
