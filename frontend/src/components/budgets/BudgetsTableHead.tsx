import {
  Box,
  IconButton,
  Stack,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material"
import { TableFormState } from "./BudgetsTable"
import { Check, Close, Edit } from "@mui/icons-material"

interface Props {
  year: number
  formState: TableFormState
  onEditButtonClick(): void
  onSaveButtonClick(): void
  onCancel(): void
  isLoading: boolean
}

export default function BudgetsTableHead(props: Props) {
  return (
    <TableHead>
      <TableRow>
        <TableCell>Category</TableCell>
        <TableCell align="right">Value of {props.year - 1} (€)</TableCell>
        <TableCell align="right">Budget for {props.year} (€)</TableCell>
        <TableCell sx={{ minWidth: 116, maxWidth: 116, width: 116 }}>
          {(() => {
            switch (props.formState.type) {
              case "Idle":
                return (
                  <Tooltip title="Edit all budgets">
                    <span>
                      <IconButton
                        aria-label="Edit all budgets"
                        onClick={props.onEditButtonClick}
                        disabled={props.isLoading}
                      >
                        <Edit />
                      </IconButton>
                    </span>
                  </Tooltip>
                )
              case "BulkEditing":
                return (
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Save all budgets">
                      <span>
                        <IconButton
                          aria-label="Save all budgets"
                          onClick={props.onSaveButtonClick}
                          disabled={props.isLoading}
                        >
                          <Check color="primary" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Cancel">
                      <span>
                        <IconButton
                          aria-label="Cancel"
                          onClick={props.onCancel}
                          disabled={props.isLoading}
                        >
                          <Close />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                )
              case "Editing":
                return <Box height={40} />
            }
          })()}
        </TableCell>
        <TableCell align="right">Delta (€)</TableCell>
        <TableCell align="right">Value of {props.year} (€)</TableCell>
        {props.year === new Date().getUTCFullYear() ? (
          <>
            <TableCell align="right">Projections for {props.year}</TableCell>
            <TableCell sx={{ minWidth: 72, maxWidth: 72, width: 72 }} />
          </>
        ) : null}
      </TableRow>
    </TableHead>
  )
}
