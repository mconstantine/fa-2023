import { ChangeEventHandler, useState } from "react"
import { FindTransactionsParams } from "../domain"
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

  const onTransactionsQueryChange: ChangeEventHandler<HTMLInputElement> = (
    event,
  ) => {
    const query = event.currentTarget.value

    setTransactionsQuery(query)

    props.onParamsChange({
      ...props.params,
      query: query === "" ? undefined : query,
    })
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
        label="Search"
        value={transactionsQuery}
        onChange={onTransactionsQueryChange}
      />
    </FormControl>
  )
}
