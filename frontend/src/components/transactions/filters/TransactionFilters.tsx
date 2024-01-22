import { Edit, Tune } from "@mui/icons-material"
import { IconButton, Stack, Typography } from "@mui/material"
import { Dispatch, SetStateAction, useState } from "react"
import {
  FindTransactionsBy,
  FindTransactionsParams,
  Transaction,
} from "../domain"
import { NetworkResponse } from "../../../network/NetworkResponse"
import { PaginatedResponse } from "../../../globalDomain"
import BulkUpdateTransactionsDialog, {
  BulkUpdateTransactionsData,
} from "../bulkUpdate/BulkUpdateTransactionsDialog"
import TransactionFiltersDialog from "./TransactionFiltersDialog"
import SearchTransactionsInput from "./SearchTransactionsInput"
import ValidatedSelect from "../../forms/inputs/ValidatedSelect"
import NumberInput from "../../forms/inputs/NumberInput"
import { useDebounce } from "../../../hooks/useDebounce"

interface Props {
  findTransactionsNetworkResponse: NetworkResponse<
    PaginatedResponse<Transaction>
  >
  updateTransactionsNetworkResponse: NetworkResponse<Transaction[]>
  params: FindTransactionsParams
  onParamsChange: Dispatch<SetStateAction<FindTransactionsParams>>
  selectedCount: number
  onBulkUpdate(data: BulkUpdateTransactionsData): Promise<boolean>
}

export default function TransactionFilters(props: Props) {
  const [filtersDialogIsOpen, setFiltersDialogIsOpen] = useState(false)
  const [updateDialogIsOpen, setUpdateDialogIsOpen] = useState(false)

  const debounceOnParamsChange: Dispatch<
    SetStateAction<FindTransactionsParams>
  > = useDebounce(props.onParamsChange, 500)

  function onFindTransactionsByChange(findBy: FindTransactionsBy): void {
    switch (findBy) {
      case FindTransactionsBy.DESCRIPTION:
        return props.onParamsChange((params) => ({ ...params, findBy }))
      case FindTransactionsBy.VALUE: {
        const min = props.findTransactionsNetworkResponse
          .map(([transactions]) =>
            Math.min(...transactions.map((transaction) => transaction.value)),
          )
          .getOrElse(0)

        const max = props.findTransactionsNetworkResponse
          .map(([transactions]) =>
            Math.max(...transactions.map((transaction) => transaction.value)),
          )
          .getOrElse(0)

        return props.onParamsChange((params) => ({
          ...params,
          findBy,
          min,
          max,
        }))
      }
    }
  }

  function onMaxValueChange(max: number): void {
    debounceOnParamsChange((params) => ({ ...params, max }))
  }

  function onMinValueChange(min: number): void {
    debounceOnParamsChange((params) => ({ ...params, min }))
  }

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
          {(() => {
            switch (props.params.findBy) {
              case FindTransactionsBy.DESCRIPTION:
                return (
                  <SearchTransactionsInput
                    params={props.params}
                    onParamsChange={debounceOnParamsChange}
                  />
                )
              case FindTransactionsBy.VALUE:
                return (
                  <Stack direction="row" spacing={1.5} sx={{ width: "100%" }}>
                    <NumberInput
                      name="maxValue"
                      value={props.params.min}
                      onChange={onMinValueChange}
                      errorMessage="Min value should be a number"
                      label="Min"
                    />
                    <NumberInput
                      name="maxValue"
                      value={props.params.max}
                      onChange={onMaxValueChange}
                      errorMessage="Max value should be a number"
                      label="Max"
                    />
                  </Stack>
                )
            }
          })()}
          <ValidatedSelect
            name="findTransactionsBy"
            value={props.params.findBy}
            options={FindTransactionsBy}
            onChange={onFindTransactionsByChange}
            label="Find by"
            optionLabels={{
              DESCRIPTION: "Description",
              VALUE: "Value",
            }}
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
