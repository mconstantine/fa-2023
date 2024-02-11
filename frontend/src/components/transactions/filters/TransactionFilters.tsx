import { Stack, Typography } from "@mui/material"
import { useState } from "react"
import { NetworkResponse } from "../../../network/NetworkResponse"
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
import { SelectableTransaction } from "../TransactionsPage"

interface Props {
  selectableTransactions: PaginationResponse<SelectableTransaction>
  updateNetworkResponse: NetworkResponse<readonly TransactionWithCategories[]>
  filters: ListTransactionsInput
  onFiltersChange(filters: ListTransactionsInput): void
  // selectedCount: number
  onUpdate(data: Omit<UpdateTransactionsInput, "ids">): Promise<boolean>
}

interface LocalState {
  query: string
  min: number
  max: number
}

export default function TransactionFilters(props: Props) {
  // const [filtersDialogIsOpen, setFiltersDialogIsOpen] = useState(false)
  // const [updateDialogIsOpen, setUpdateDialogIsOpen] = useState(false)

  const [localState, setLocalState] = useState<LocalState>({
    query: "search_query" in props.filters ? props.filters.search_query : "",
    min: "min" in props.filters ? props.filters.min : 0,
    max: "max" in props.filters ? props.filters.max : 0,
  })

  const debounceOnFiltersChange: (filters: ListTransactionsInput) => void =
    useDebounce(props.onFiltersChange, 500)

  const selectedCount = props.selectableTransactions.edges.reduce(
    (count, edge) => {
      if (edge.node.isSelected) {
        return count + 1
      } else {
        return count
      }
    },
    0,
  )

  function onSubjectChange(subject: ListTransactionsInput["subject"]): void {
    switch (subject) {
      case "description":
        return props.onFiltersChange({
          ...props.filters,
          subject,
          search_query: "",
        })
      case "value": {
        const values = props.selectableTransactions.edges.map(
          (edge) => edge.node.value,
        )

        const min = Math.min(...values)
        const max = Math.max(...values)

        setLocalState((state) => ({ ...state, min, max }))
        return props.onFiltersChange({ ...props.filters, subject, min, max })
      }
    }
  }

  function onQueryChange(query: string): void {
    setLocalState((state) => ({ ...state, query }))

    debounceOnFiltersChange({
      ...props.filters,
      subject: "description",
      search_query: query,
    })
  }

  function onMaxValueChange(max: number): void {
    setLocalState((state) => ({ ...state, max }))

    if (props.filters.subject === "value") {
      debounceOnFiltersChange({
        ...props.filters,
        subject: "value",
        max,
      })
    }
  }

  function onMinValueChange(min: number): void {
    setLocalState((state) => ({ ...state, min }))

    if (props.filters.subject === "value") {
      debounceOnFiltersChange({
        ...props.filters,
        subject: "value",
        min,
      })
    }
  }

  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      justifyContent="space-between"
    >
      {selectedCount > 0 ? (
        <>
          <Typography>{selectedCount} selected</Typography>
          {/* <IconButton
            aria-label="Edit"
            onClick={() => setUpdateDialogIsOpen(true)}
            color="primary"
          >
            <Edit />
          </IconButton> */}
          {/* <BulkUpdateTransactionsDialog
            isOpen={updateDialogIsOpen}
            onOpenChange={setUpdateDialogIsOpen}
            updateTransactionsNetworkResponse={props.updateNetworkResponse}
            onBulkUpdate={props.onBulkUpdate}
          /> */}
        </>
      ) : (
        <>
          {(() => {
            switch (props.filters.subject) {
              case "description":
                return (
                  <SearchTransactionsInput
                    query={localState.query}
                    onQueryChange={onQueryChange}
                  />
                )
              case "value":
                return (
                  <Stack direction="row" spacing={1.5} sx={{ width: "100%" }}>
                    <NumberInput
                      name="maxValue"
                      value={localState.min}
                      onChange={onMinValueChange}
                      errorMessage="Min value should be a number"
                      label="Min"
                    />
                    <NumberInput
                      name="maxValue"
                      value={localState.max}
                      onChange={onMaxValueChange}
                      errorMessage="Max value should be a number"
                      label="Max"
                    />
                  </Stack>
                )
            }
          })()}
          <ValidatedSelect
            sx={{ minWidth: "9em" }}
            name="findTransactionsBy"
            value={props.filters.subject}
            options={{
              description: "description",
              value: "value",
            }}
            onChange={onSubjectChange}
            label="Find by"
            optionLabels={{
              description: "Description",
              value: "Value",
            }}
          />
          {/* <IconButton
            aria-label="Filters"
            sx={{ width: "40px" }}
            onClick={() => setFiltersDialogIsOpen(true)}
          >
            <Tune />
          </IconButton> */}
          {/* <TransactionFiltersDialog
            isOpen={filtersDialogIsOpen}
            onOpenChange={setFiltersDialogIsOpen}
            findTransactionsNetworkResponse={props.selectableTransactions}
            params={props.filters}
            onParamsChange={props.onFiltersChange}
          /> */}
        </>
      )}
    </Stack>
  )
}
