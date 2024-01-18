import { Check, Close, Edit } from "@mui/icons-material"
import {
  Box,
  IconButton,
  Stack,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material"
import { TableFormState } from "./PredictionsTable"

interface Props {
  year: number
  formState: TableFormState
  onEditButtonClick(): void
  onSaveButtonClick(): void
  onCancel(): void
}

export default function PredictionsTableHead(props: Props) {
  return (
    <TableHead>
      <TableRow>
        <TableCell>Category</TableCell>
        <TableCell align="right">Value of {props.year - 1} (€)</TableCell>
        <TableCell align="right">Prediction for {props.year} (€)</TableCell>
        <TableCell sx={{ minWidth: 116, maxWidth: 116, width: 116 }}>
          {(() => {
            switch (props.formState.type) {
              case "idle":
                return (
                  <IconButton
                    aria-label="Edit all"
                    onClick={() => props.onEditButtonClick()}
                  >
                    <Edit />
                  </IconButton>
                )
              case "bulkEditing":
                return (
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      aria-label="Save all"
                      onClick={() => props.onSaveButtonClick()}
                    >
                      <Check color="primary" />
                    </IconButton>
                    <IconButton
                      aria-label="Cancel"
                      onClick={() => props.onCancel()}
                    >
                      <Close />
                    </IconButton>
                  </Stack>
                )
              case "editing":
                return <Box height={40} />
            }
          })()}
        </TableCell>
      </TableRow>
    </TableHead>
  )
}
