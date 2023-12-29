import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material"
import { ReactPortal, useState } from "react"
import { createPortal } from "react-dom"

interface DialogProps {
  title: string
  message: string
  yesButtonLabel?: string
  noButtonLabel?: string
}

type UseConfirmationOutput<A extends unknown[]> = [
  callbackWithConfirmation: (...args: A) => void,
  dialog: ReactPortal,
]

export function useConfirmation<I extends unknown[]>(
  callback: (...args: I) => unknown,
  getDialogProps: (...args: I) => DialogProps,
): UseConfirmationOutput<I> {
  const [args, setArgs] = useState<I | null>(null)

  const dialogProps: DialogProps =
    args === null
      ? {
          title: "",
          message: "",
          yesButtonLabel: "",
          noButtonLabel: "",
        }
      : getDialogProps(...args)

  const dialog: ReactPortal = createPortal(
    <Dialog
      open={args !== null}
      onClose={() => setArgs(null)}
      aria-labelledby={dialogProps.title}
      aria-describedby={dialogProps.message}
    >
      <DialogTitle>{dialogProps.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{dialogProps.message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onConfirm}>
          {dialogProps.yesButtonLabel ?? "Yes"}
        </Button>
        <Button onClick={() => setArgs(null)}>
          {dialogProps.noButtonLabel ?? "No"}
        </Button>
      </DialogActions>
    </Dialog>,
    document.body,
  )

  function onConfirm() {
    if (args !== null) {
      callback(...args)
      setArgs(null)
    }
  }

  function callbackWithDialog(...args: I): void {
    setArgs(args)
  }

  return [callbackWithDialog, dialog]
}
