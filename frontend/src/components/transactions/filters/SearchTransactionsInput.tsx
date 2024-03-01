import {
  FormControl,
  InputAdornment,
  InputLabel,
  OutlinedInput,
} from "@mui/material"
import { Search } from "@mui/icons-material"

interface Props {
  query: string
  onQueryChange(query: string): void
}

export default function SearchTransactionsInput(props: Props) {
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
        value={props.query}
        onChange={(event) => props.onQueryChange(event.currentTarget.value)}
        autoFocus
      />
    </FormControl>
  )
}
