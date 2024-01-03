import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
} from "@mui/material"
import { useForm } from "../../hooks/useForm"
import Form from "../forms/Form"
import { NetworkResponse } from "../../network/NetworkResponse"
import FileInput from "../forms/inputs/FileInput"

export interface ImportFormData extends Record<string, unknown> {
  bank: File
  paypal: File
}

interface Props {
  isOpen: boolean
  onClose(): void
  onSubmit(data: ImportFormData): void
}

export default function ImportTransactionsDialog(props: Props) {
  const { inputProps, submit, isValid } = useForm<ImportFormData>(
    {
      bank: null,
      paypal: null,
    },
    (data) => {
      console.log(data)
    },
  )

  function onFileSelect(
    expectedFileName: keyof ImportFormData,
  ): (file: File) => void {
    return (file) => {
      const isFileNameValid =
        file.name.toLowerCase() === `${expectedFileName}.csv`

      inputProps(expectedFileName, null).onChange(isFileNameValid ? file : null)
    }
  }

  return (
    <Dialog open={props.isOpen} onClose={props.onClose}>
      <DialogTitle>Import transactions</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5}>
          <DialogContentText>
            You should upload two files, one named "bank.csv" containing bank
            transactions, one named "paypal.csv" containing (guess what?) PayPal
            transactions.
          </DialogContentText>
          <Form
            onSubmit={submit}
            isValid={isValid}
            networkResponse={new NetworkResponse()}
            submitButtonLabel="Import"
          >
            <Stack justifyContent="start" spacing={1.5}>
              <FileInput
                {...inputProps("bank", null)}
                onChange={onFileSelect("bank")}
                label="Bank transactions"
                buttonProps={{
                  color:
                    inputProps("bank", null).value === null
                      ? "primary"
                      : "success",
                }}
              />
              <FileInput
                {...inputProps("paypal", null)}
                onChange={onFileSelect("paypal")}
                label="PayPal transactions"
                buttonProps={{
                  color:
                    inputProps("paypal", null).value === null
                      ? "primary"
                      : "success",
                }}
              />
            </Stack>
          </Form>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
