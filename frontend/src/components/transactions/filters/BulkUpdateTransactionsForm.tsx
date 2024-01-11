import { Stack, Typography } from "@mui/material"
import { useForm } from "../../../hooks/useForm"
import { NetworkResponse } from "../../../network/NetworkResponse"
import Form from "../../forms/Form"
import NonBlankInput from "../../forms/inputs/NonBlankInput"

export interface BulkUpdateTransactionsData extends Record<string, unknown> {
  description: string
}

interface Props {
  networkResponse: NetworkResponse<unknown>
  onSubmit(data: BulkUpdateTransactionsData): void
  onCancel(): void
}

export default function BulkUpdateTransactionsForm(props: Props) {
  const { inputProps, submit, isValid } = useForm<BulkUpdateTransactionsData>(
    {
      description: null,
    },
    props.onSubmit,
  )

  return (
    <Stack spacing={1.5}>
      <Typography variant="h5">Update transactions</Typography>
      <Form
        onSubmit={submit}
        isValid={isValid}
        submitButtonLabel="Update transactions"
        networkResponse={props.networkResponse}
        cancelAction={props.onCancel}
      >
        <NonBlankInput
          label="Description"
          {...inputProps("description", null)}
          errorMessageWhenBlank="A transaction description cannot be blank"
        />
      </Form>
    </Stack>
  )
}
