import * as S from "@effect/schema/Schema"
import { Stack, Typography } from "@mui/material"
import { useState } from "react"
import { NetworkResponse } from "../../../network/NetworkResponse"
import SearchTransactionsInput from "./SearchTransactionsInput"
import ValidatedSelect from "../../forms/inputs/ValidatedSelect"
import { useDebounce } from "../../../hooks/useDebounce"
import { PaginationResponse } from "../../../globalDomain"
import { SelectableTransaction } from "../TransactionsPage"
import {
  ListTransactionsInput,
  TransactionWithCategories,
  UpdateTransactionsInput,
} from "../domain"
import TextInput from "../../forms/inputs/TextInput"
import { Either, pipe } from "effect"
import { useForm } from "../../../hooks/useForm"
import { constVoid } from "effect/Function"

interface Props {
  selectableTransactions: PaginationResponse<SelectableTransaction>
  updateNetworkResponse: NetworkResponse<readonly TransactionWithCategories[]>
  filters: ListTransactionsInput
  onFiltersChange(filters: ListTransactionsInput): void
  // selectedCount: number
  onUpdate(data: Omit<UpdateTransactionsInput, "ids">): Promise<boolean>
}

export default function TransactionFilters(props: Props) {
  // const [filtersDialogIsOpen, setFiltersDialogIsOpen] = useState(false)
  // const [updateDialogIsOpen, setUpdateDialogIsOpen] = useState(false)

  const [query, setQuery] = useState(
    "search_query" in props.filters ? props.filters.search_query : "",
  )

  const { inputProps } = useForm({
    initialValues: {
      min: "min" in props.filters ? props.filters.min : 0,
      max: "max" in props.filters ? props.filters.max : 0,
    },
    validators: {
      min: S.NumberFromString,
      max: S.NumberFromString,
    },
    submit: constVoid,
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

        return props.onFiltersChange({ ...props.filters, subject, min, max })
      }
    }
  }

  function onQueryChange(query: string): void {
    setQuery(query)

    debounceOnFiltersChange({
      ...props.filters,
      subject: "description",
      search_query: query,
    })
  }

  function onValuesChange(
    min: Either.Either<string, number>,
    max: Either.Either<string, number>,
  ): void {
    return pipe(
      { min, max },
      Either.all,
      Either.match({
        onLeft: constVoid,
        onRight: ({ max, min }) =>
          debounceOnFiltersChange({
            ...props.filters,
            subject: "value",
            max,
            min,
          }),
      }),
    )
  }

  function onMaxValueChange(max: string): Either.Either<string, number> {
    const maxValidation = inputProps("max").onChange(max)

    onValuesChange(
      inputProps("min").onChange(inputProps("min").value),
      maxValidation,
    )

    return maxValidation
  }

  function onMinValueChange(min: string): Either.Either<string, number> {
    const minValidation = inputProps("min").onChange(min)

    onValuesChange(
      minValidation,
      inputProps("max").onChange(inputProps("max").value),
    )

    return minValidation
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
                    query={query}
                    onQueryChange={onQueryChange}
                  />
                )
              case "value":
                return (
                  <Stack direction="row" spacing={1.5} sx={{ width: "100%" }}>
                    <TextInput
                      {...inputProps("min")}
                      onChange={onMinValueChange}
                      label="Min"
                    />
                    <TextInput
                      {...inputProps("max")}
                      onChange={onMaxValueChange}
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
