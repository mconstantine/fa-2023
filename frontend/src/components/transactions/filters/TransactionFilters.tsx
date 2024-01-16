import { Edit, Tune } from "@mui/icons-material"
import { IconButton, Stack } from "@mui/material"
import { useState } from "react"
import { FindTransactionsParams, Transaction } from "../domain"
import { NetworkResponse } from "../../../network/NetworkResponse"
import { BulkUpdateTransactionsData } from "../bulkUpdate/BulkUpdateTransactionsForm"
import { PaginatedResponse } from "../../../globalDomain"
import SelectAllCheckbox from "./SelectAllCheckbox"
import BulkUpdateTransactionsDialog from "./BulkUpdateTransactionsDialog"
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
  allIsSelected: boolean
  onSelectAllChange(allIsSelected: boolean): void
  onBulkUpdate(data: BulkUpdateTransactionsData): Promise<boolean>
}

/*
TODO:
- Figure out why there are requests to /categories as soon as the app starts
- Actually implement pagination
*/
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
      <SelectAllCheckbox
        allIsSelected={props.allIsSelected}
        selectedCount={props.selectedCount}
        onSelectAllChange={props.onSelectAllChange}
      />
      {props.selectedCount > 0 ? (
        <>
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
