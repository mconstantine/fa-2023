import { Edit, Tune } from "@mui/icons-material"
import { IconButton, Stack, Typography } from "@mui/material"
import { Dispatch, SetStateAction, useState } from "react"
import { FindTransactionsBy, FindTransactionsParams } from "../domain"
import { NetworkResponse } from "../../../network/NetworkResponse"
import BulkUpdateTransactionsDialog from "../bulkUpdate/BulkUpdateTransactionsDialog"
import TransactionFiltersDialog from "./TransactionFiltersDialog"
import SearchTransactionsInput from "./SearchTransactionsInput"
import ValidatedSelect from "../../forms/inputs/ValidatedSelect"
import NumberInput from "../../forms/inputs/NumberInput"
import { useDebounce } from "../../../hooks/useDebounce"
import { PaginationResponse } from "../../../globalDomain"
import {
  ListTransactionsInput,
  TransactionWithCategories,
  UpdateTransactionsInput,
} from "../api"

interface Props {
  listNetworkResponse: NetworkResponse<
    PaginationResponse<TransactionWithCategories>
  >
  updateNetworkResponse: NetworkResponse<readonly TransactionWithCategories[]>
  filters: ListTransactionsInput
  onFiltersChange(filters: ListTransactionsInput): void
  // selectedCount: number
  onUpdate(data: Omit<UpdateTransactionsInput, "ids">): Promise<boolean>
}

export default function TransactionFilters(props: Props) {
  const [filtersDialogIsOpen, setFiltersDialogIsOpen] = useState(false)
  const [updateDialogIsOpen, setUpdateDialogIsOpen] = useState(false)

  const debounceOnFiltersChange: Dispatch<
    SetStateAction<FindTransactionsParams>
  > = useDebounce(props.onFiltersChange, 500)

  function onFindTransactionsByChange(findBy: FindTransactionsBy): void {
    switch (findBy) {
      case FindTransactionsBy.DESCRIPTION:
        return props.onFiltersChange((params) => ({ ...params, findBy }))
      case FindTransactionsBy.VALUE: {
        const min = props.listNetworkResponse
          .map(([transactions]) =>
            Math.min(...transactions.map((transaction) => transaction.value)),
          )
          .getOrElse(0)

        const max = props.listNetworkResponse
          .map(([transactions]) =>
            Math.max(...transactions.map((transaction) => transaction.value)),
          )
          .getOrElse(0)

        return props.onFiltersChange((params) => ({
          ...params,
          findBy,
          min,
          max,
        }))
      }
    }
  }

  function onMaxValueChange(max: number): void {
    debounceOnFiltersChange((params) => ({ ...params, max }))
  }

  function onMinValueChange(min: number): void {
    debounceOnFiltersChange((params) => ({ ...params, min }))
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
            updateTransactionsNetworkResponse={props.updateNetworkResponse}
            onBulkUpdate={props.onBulkUpdate}
          />
        </>
      ) : (
        <>
          {(() => {
            switch (props.filters.findBy) {
              case FindTransactionsBy.DESCRIPTION:
                return (
                  <SearchTransactionsInput
                    params={props.filters}
                    onParamsChange={debounceOnFiltersChange}
                  />
                )
              case FindTransactionsBy.VALUE:
                return (
                  <Stack direction="row" spacing={1.5} sx={{ width: "100%" }}>
                    <NumberInput
                      name="maxValue"
                      value={props.filters.min}
                      onChange={onMinValueChange}
                      errorMessage="Min value should be a number"
                      label="Min"
                    />
                    <NumberInput
                      name="maxValue"
                      value={props.filters.max}
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
            value={props.filters.findBy}
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
            findTransactionsNetworkResponse={props.listNetworkResponse}
            params={props.filters}
            onParamsChange={props.onFiltersChange}
          />
        </>
      )}
    </Stack>
  )
}
