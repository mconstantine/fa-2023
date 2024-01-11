import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
} from "@mui/material"
import { useForm } from "../../hooks/useForm"
import Form from "../forms/Form"
import FileInput from "../forms/inputs/FileInput"
import { useFilesUpload } from "../../hooks/network"
import { networkResponse } from "../../network/NetworkResponse"

export interface ImportFormData extends Record<string, unknown> {
  bank: File
  paypal: File
}

interface Props {
  isOpen: boolean
  onClose(): void
  onSubmit(): void
}

export default function ImportTransactionsDialog(props: Props) {
  const [uploadResponse, uploadFiles] = useFilesUpload<{ errors: string[] }>(
    "/transactions/import",
    "files",
  )

  const { inputProps, submit, isValid } = useForm<ImportFormData>(
    {
      bank: null,
      paypal: null,
    },
    (data) => {
      uploadFiles([data.bank, data.paypal]).then((result) => {
        if (result?.errors.length === 0) {
          props.onSubmit()
        }
      })
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

  const parsedUploadResponse = uploadResponse.flatMap((data) => {
    if (data.errors.length > 0) {
      return networkResponse.fromFailure(
        400,
        `The server raised ${data.errors.length} errors. See the network response for details.`,
      )
    } else {
      return networkResponse.fromSuccess()
    }
  })

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
            networkResponse={parsedUploadResponse}
            submitButtonLabel="Import"
            cancelAction={props.onClose}
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
