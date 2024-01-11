import { Search, Tune } from "@mui/icons-material"
import {
  Dialog,
  DialogContent,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Stack,
} from "@mui/material"
import { ChangeEventHandler, useState } from "react"
import TransactionFiltersDialogContent from "./TransactionFiltersDialogContent"
import { FindTransactionsParams } from "../domain"
import { NetworkResponse } from "../../../network/NetworkResponse"
import { useDebounce } from "../../../hooks/useDebounce"

interface Props {
  networkResponse: NetworkResponse<unknown>
  params: FindTransactionsParams
  onChange(params: FindTransactionsParams): void
}

export default function TransactionFilters(props: Props) {
  const [query, setQuery] = useState(props.params.query ?? "")
  const [filtersDialogIsOpen, setFiltersDialogIsOpen] = useState(false)

  const debounceSearch = useDebounce(function search(query: string) {
    props.onChange({
      ...props.params,
      query: query === "" ? undefined : query,
    })
  }, 500)

  const onQueryChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setQuery(event.currentTarget.value)
    debounceSearch(event.currentTarget.value)
  }

  function onFiltersChange(params: FindTransactionsParams): void {
    props.onChange(params)
    setFiltersDialogIsOpen(false)
  }

  return (
    <Stack direction="row" spacing={1.5}>
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
