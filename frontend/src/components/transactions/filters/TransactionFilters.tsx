import { Edit, Search, Tune } from "@mui/icons-material"
import {
  Checkbox,
  Dialog,
  DialogContent,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Stack,
  Tooltip,
} from "@mui/material"
import { ChangeEvent, ChangeEventHandler, useState } from "react"
import TransactionFiltersDialogContent from "./TransactionFiltersDialogContent"
import { FindTransactionsParams } from "../domain"
import { NetworkResponse } from "../../../network/NetworkResponse"
import { useDebounce } from "../../../hooks/useDebounce"
import BulkUpdateTransactionsForm, {
  BulkUpdateTransactionsData,
} from "../bulkUpdate/BulkUpdateTransactionsForm"

interface Props {
  findTransactionsNetworkResponse: NetworkResponse<unknown>
  updateTransactionsNetworkResponse: NetworkResponse<unknown>
  params: FindTransactionsParams
  onParamsChange(params: FindTransactionsParams): void
  selectedCount: number
  allIsSelected: boolean
  onSelectAllChange(allIsSelected: boolean): void
  onBulkUpdate(data: BulkUpdateTransactionsData): Promise<boolean>
}

export default function TransactionFilters(props: Props) {
  const [query, setQuery] = useState(props.params.query ?? "")
  const [filtersDialogIsOpen, setFiltersDialogIsOpen] = useState(false)
  const [updateDialogIsOpen, setUpdateDialogIsOpen] = useState(false)

  const debounceSearch = useDebounce(function search(query: string) {
    props.onParamsChange({
      ...props.params,
      query: query === "" ? undefined : query,
    })
  }, 500)

  const onQueryChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setQuery(event.currentTarget.value)
    debounceSearch(event.currentTarget.value)
  }

  function onFiltersChange(params: FindTransactionsParams): void {
    props.onParamsChange(params)
    setFiltersDialogIsOpen(false)
  }

  function onSelectAllChange(
    _: ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ): void {
    props.onSelectAllChange(checked)
  }

  function onBulkUpdateSubmit(data: BulkUpdateTransactionsData): void {
    props.onBulkUpdate(data).then((didSucceed) => {
      if (didSucceed) {
        setUpdateDialogIsOpen(false)
      }
    })
  }

  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      justifyContent="space-between"
    >
      <Tooltip title="Select all">
        {props.selectedCount > 0 ? (
          <FormControlLabel
            control={
              <Checkbox
                aria-label="Select all"
                checked={props.allIsSelected}
                onChange={onSelectAllChange}
              />
            }
            label={`${props.selectedCount} selected`}
          />
        ) : (
          <Checkbox
            aria-label="Select all"
            value={props.allIsSelected}
            onChange={onSelectAllChange}
          />
        )}
      </Tooltip>
      {props.selectedCount > 0 ? (
        <>
          <IconButton
            aria-label="Edit"
            onClick={() => setUpdateDialogIsOpen(true)}
            color="primary"
          >
            <Edit />
          </IconButton>
          <Dialog
            open={updateDialogIsOpen}
            onClose={() => setUpdateDialogIsOpen(false)}
          >
            <DialogContent>
              <BulkUpdateTransactionsForm
                networkResponse={props.updateTransactionsNetworkResponse}
                onSubmit={onBulkUpdateSubmit}
                onCancel={() => setUpdateDialogIsOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <>
          <FormControl variant="outlined" fullWidth>
            <InputLabel htmlFor="search">Search</InputLabel>
            <OutlinedInput
              id="search"
              endAdornment={
                <InputAdornment position="end">
                  <Search />
                </InputAdornment>
              }
              label="Password"
              value={query}
              onChange={onQueryChange}
            />
          </FormControl>
          <IconButton
            aria-label="Filters"
            sx={{ width: "40px" }}
            onClick={() => setFiltersDialogIsOpen(true)}
          >
            <Tune />
          </IconButton>
          <Dialog
            open={filtersDialogIsOpen}
            onClose={() => setFiltersDialogIsOpen(false)}
          >
            <DialogContent>
              <TransactionFiltersDialogContent
                params={props.params}
                onChange={onFiltersChange}
                networkResponse={props.findTransactionsNetworkResponse}
              />
            </DialogContent>
          </Dialog>
        </>
      )}
    </Stack>
  )
}
