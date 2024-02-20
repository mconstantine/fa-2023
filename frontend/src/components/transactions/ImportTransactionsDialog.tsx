import * as S from "@effect/schema/Schema"
import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
} from "@mui/material"
import { useForm } from "../../hooks/useForm"
import { FileFromSelf } from "../../globalDomain"
import Form from "../forms/Form"
import FileInput from "../forms/inputs/FileInput"
import { constTrue } from "effect/Function"
import { Either } from "effect"
import { UploadTransactionsInput } from "./domain"
import * as NetworkResponse from "../../network/NetworkResponse"
import { HttpError } from "../../hooks/network"

interface Props {
  isOpen: boolean
  networkResponse: NetworkResponse.NetworkResponse<HttpError, unknown>
  onClose(): void
  onSubmit(body: UploadTransactionsInput): void
}

export default function ImportTransactionsDialog(props: Props) {
  const { inputProps, submit, isValid, formError } = useForm({
    initialValues: {
      bank: null,
    },
    validators: {
      bank: FileFromSelf.pipe(
        S.filter(constTrue, { message: () => "Please choose a file" }),
      ),
    },
    formValidator: (data) => {
      if (!data.bank.name.endsWith(".csv")) {
        return Either.left("Please upload a CSV file")
      } else {
        return Either.right(data)
      }
    },
    submit: props.onSubmit,
  })

  return (
    <Dialog open={props.isOpen} onClose={props.onClose}>
      <DialogTitle>Import transactions</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5}>
          <DialogContentText>
            You should upload a CSV file containing bank transactions.
          </DialogContentText>
          <Form
            onSubmit={submit}
            isValid={isValid}
            networkResponse={props.networkResponse}
            submitButtonLabel="Import"
            cancelAction={props.onClose}
            formError={formError}
          >
            <FileInput {...inputProps("bank")} label="Bank transactions" />
          </Form>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
