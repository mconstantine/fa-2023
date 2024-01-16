import { ChangeEventHandler, useState } from "react"
import { FindTransactionsParams } from "../domain"
import { useDebounce } from "../../../hooks/useDebounce"
import {
  FormControl,
  InputAdornment,
  InputLabel,
  OutlinedInput,
} from "@mui/material"
import { Search } from "@mui/icons-material"

interface Props {
  params: FindTransactionsParams
  onParamsChange(params: FindTransactionsParams): void
}

export default function SearchTransactionsInput(props: Props) {
  const [transactionsQuery, setTransactionsQuery] = useState(
    props.params.query ?? "",
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

  const onTransactionsQueryChange: ChangeEventHandler<HTMLInputElement> = (
    event,
  ) => {
    setTransactionsQuery(event.currentTarget.value)
    debounceTransactionsSearch(event.currentTarget.value)
  }

  return (
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
  )
}
