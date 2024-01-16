import { Dialog, DialogContent } from "@mui/material"
import { NetworkResponse } from "../../../network/NetworkResponse"
import BulkUpdateTransactionsForm, {
  BulkUpdateTransactionsData,
} from "../bulkUpdate/BulkUpdateTransactionsForm"
import { Transaction } from "../domain"

interface Props {
  isOpen: boolean
  onOpenChange(isOpen: boolean): void
  updateTransactionsNetworkResponse: NetworkResponse<Transaction[]>
  onBulkUpdate(data: BulkUpdateTransactionsData): Promise<boolean>
}

export default function BulkUpdateTransactionsDialog(props: Props) {
  function onBulkUpdateSubmit(data: BulkUpdateTransactionsData): void {
    props.onBulkUpdate(data).then((didSucceed) => {
      if (didSucceed) {
        props.onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={props.isOpen} onClose={() => props.onOpenChange(false)}>
      <DialogContent>
        <BulkUpdateTransactionsForm
          networkResponse={props.updateTransactionsNetworkResponse}
          onSubmit={onBulkUpdateSubmit}
          onCancel={() => props.onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
