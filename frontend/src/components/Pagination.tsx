import {
  ButtonGroup,
  FormControl,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material"
import { UsePaginationOutput } from "../hooks/usePagination"
import { ChevronLeft, ChevronRight } from "@mui/icons-material"

export default function Pagination(props: UsePaginationOutput) {
  return (
    <Paper>
      <Stack
        direction="row"
        spacing={3}
        justifyContent="flex-end"
        alignItems="center"
        sx={{ p: 1.5 }}
      >
        <Typography>{props.count} total rows</Typography>
        <FormControl>
          <FormControlLabel
            label="Rows per page"
            labelPlacement="start"
            control={
              <Select
                sx={{ ml: 1.5 }}
                variant="standard"
                value={props.rowsPerPage}
                onChange={(event) =>
                  props.onRowsPerPageChange(event.target.value as number)
                }
                label="Rows per page"
              >
                {props.rowsPerPageOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            }
          />
        </FormControl>
        <ButtonGroup>
          <IconButton
            aria-label="Previous page"
            disabled={!props.hasPreviousPage}
            onClick={() => props.onPageChange("backward")}
          >
            <ChevronLeft />
          </IconButton>
          <IconButton
            aria-label="Next page"
            disabled={!props.hasNextPage}
            onClick={() => props.onPageChange("forward")}
          >
            <ChevronRight />
          </IconButton>
        </ButtonGroup>
      </Stack>
    </Paper>
  )
}
