import { TableCell, TableHead, TableRow } from "@mui/material"

interface Props {
  year: number
  // formState: TableFormState
  // isLoading: boolean
  // onEditButtonClick(): void
  // onSaveButtonClick(): void
  // onCancel(): void
}

export default function BudgetsTableHead(props: Props) {
  return (
    <TableHead>
      <TableRow>
        <TableCell>Category</TableCell>
        <TableCell align="right">Value of {props.year - 1} (€)</TableCell>
        <TableCell align="right">Budget for {props.year} (€)</TableCell>
        <TableCell align="right">Delta (€)</TableCell>
        {/* <TableCell sx={{ minWidth: 116, maxWidth: 116, width: 116 }}>
          {(() => {
            switch (props.formState.type) {
              case "idle":
                return (
                  <IconButton
                    aria-label="Edit all"
                    onClick={() => props.onEditButtonClick()}
                    disabled={props.isLoading}
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
                      disabled={props.isLoading}
                    >
                      <Check color="primary" />
                    </IconButton>
                    <IconButton
                      aria-label="Cancel"
                      onClick={() => props.onCancel()}
                      disabled={props.isLoading}
                    >
                      <Close />
                    </IconButton>
                  </Stack>
                )
              case "editing":
                return <Box height={40} />
            }
          })()}
        </TableCell> */}
      </TableRow>
    </TableHead>
  )
}
