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
import { FindTransactionsParams, Transaction } from "../domain"
import { NetworkResponse } from "../../../network/NetworkResponse"
import { useDebounce } from "../../../hooks/useDebounce"
import BulkUpdateTransactionsForm, {
  BulkUpdateTransactionsData,
} from "../bulkUpdate/BulkUpdateTransactionsForm"
import { PaginatedResponse } from "../../../globalDomain"
import { useQuery } from "../../../hooks/network"
import { Category, FindCategoryParams } from "../../categories/domain"

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
TODO: this is doing 4 different things:
1. Search for transactions
2. Selection handling
3. Filtering for transactions
4. Bulk update for transactions

Also:
- Add cancel buttons to dialogs
- Figure out why there are requests to /categories as soon as the app starts
- Actually implement pagination
*/
export default function TransactionFilters(props: Props) {
  const [transactionsQuery, setTransactionsQuery] = useState(
    props.params.query ?? "",
  )

  const [categoriesQuery, setCategoriesQuery] = useState("")
  const [categoriesParams, setCategoriesParams] = useState<FindCategoryParams>(
    {},
  )
  const [filtersDialogIsOpen, setFiltersDialogIsOpen] = useState(false)
  const [updateDialogIsOpen, setUpdateDialogIsOpen] = useState(false)

  const [categoriesResponse] = useQuery<FindCategoryParams, Category[]>(
    "/categories",
    categoriesParams,
  )

  const debounceTransactionsSearch = useDebounce(function search(
    query: string,
  ) {
    props.onParamsChange({
      ...props.params,
      query: query === "" ? undefined : query,
    })
  },
  500)

  const debounceCategoriesSearch = useDebounce(function search(query: string) {
    setCategoriesParams({ query })
  }, 500)

  const onTransactionsQueryChange: ChangeEventHandler<HTMLInputElement> = (
    event,
  ) => {
    setTransactionsQuery(event.currentTarget.value)
    debounceTransactionsSearch(event.currentTarget.value)
  }

  function onCategoriesQueryChange(query: string) {
    setCategoriesQuery(query)
    debounceCategoriesSearch(query)
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
              value={transactionsQuery}
              onChange={onTransactionsQueryChange}
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
                onFiltersChange={onFiltersChange}
                transactionsNetworkResponse={
                  props.findTransactionsNetworkResponse
                }
                categoriesNetworkResponse={categoriesResponse}
                categoriesSearchQuery={categoriesQuery}
                onCategoriesSearchQueryChange={onCategoriesQueryChange}
              />
            </DialogContent>
          </Dialog>
        </>
      )}
    </Stack>
  )
}
