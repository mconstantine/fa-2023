import { Edit, Tune } from "@mui/icons-material"
import { IconButton, Stack, Typography } from "@mui/material"
import { useState } from "react"
import { FindTransactionsParams, Transaction } from "../domain"
import { NetworkResponse } from "../../../network/NetworkResponse"
import { PaginatedResponse } from "../../../globalDomain"
import BulkUpdateTransactionsDialog, {
  BulkUpdateTransactionsData,
} from "../bulkUpdate/BulkUpdateTransactionsDialog"
import TransactionFiltersDialog from "./TransactionFiltersDialog"
import SearchTransactionsInput from "./SearchTransactionsInput"

interface Props {
  findTransactionsNetworkResponse: NetworkResponse<
    PaginatedResponse<Transaction>
  >
  updateTransactionsNetworkResponse: NetworkResponse<Transaction[]>
  params: FindTransactionsParams
  onParamsChange(params: FindTransactionsParams): void
  selectedCount: number
  onBulkUpdate(data: BulkUpdateTransactionsData): Promise<boolean>
}

export default function TransactionFilters(props: Props) {
  const [filtersDialogIsOpen, setFiltersDialogIsOpen] = useState(false)
  const [updateDialogIsOpen, setUpdateDialogIsOpen] = useState(false)

  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      justifyContent="space-between"
    >
      {props.selectedCount > 0 ? (
        <>
          <Typography>{props.selectedCount} selected</Typography>
          <IconButton
            aria-label="Edit"
            onClick={() => setUpdateDialogIsOpen(true)}
            color="primary"
          >
            <Edit />
          </IconButton>
          <BulkUpdateTransactionsDialog
            isOpen={updateDialogIsOpen}
            onOpenChange={setUpdateDialogIsOpen}
            updateTransactionsNetworkResponse={
              props.updateTransactionsNetworkResponse
            }
            onBulkUpdate={props.onBulkUpdate}
          />
        </>
      ) : (
        <>
          <SearchTransactionsInput
            params={props.params}
            onParamsChange={props.onParamsChange}
          />
          <IconButton
            aria-label="Filters"
            sx={{ width: "40px" }}
            onClick={() => setFiltersDialogIsOpen(true)}
          >
            <Tune />
          </IconButton>
          <TransactionFiltersDialog
            isOpen={filtersDialogIsOpen}
            onOpenChange={setFiltersDialogIsOpen}
            findTransactionsNetworkResponse={
              props.findTransactionsNetworkResponse
            }
            params={props.params}
            onParamsChange={props.onParamsChange}
          />
        </>
      )}
    </Stack>
  )
}
