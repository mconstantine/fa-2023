import { Search, Tune } from "@mui/icons-material"
import {
  Checkbox,
  Dialog,
  DialogContent,
  FormControl,
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

interface Props {
  networkResponse: NetworkResponse<unknown>
  params: FindTransactionsParams
  onParamsChange(params: FindTransactionsParams): void
  allIsSelected: boolean
  onSelectAllChange(allIsSelected: boolean): void
}

export default function TransactionFilters(props: Props) {
  const [query, setQuery] = useState(props.params.query ?? "")
  const [filtersDialogIsOpen, setFiltersDialogIsOpen] = useState(false)

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

  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Tooltip title="Select all">
        <Checkbox
          aria-label="Select all"
          value={props.allIsSelected}
          onChange={onSelectAllChange}
        />
      </Tooltip>
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
        sx={{ width: "56px" }}
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
            networkResponse={props.networkResponse}
          />
        </DialogContent>
      </Dialog>
    </Stack>
  )
}
