import { Search, Tune } from "@mui/icons-material"
import {
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Stack,
} from "@mui/material"

export default function TransactionFilters() {
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
        />
      </FormControl>
      <IconButton aria-label="Filters" sx={{ width: "56px" }}>
        <Tune />
      </IconButton>
    </Stack>
  )
}
