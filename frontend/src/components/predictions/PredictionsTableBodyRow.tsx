import { Box, IconButton, Stack, TableCell, TableRow } from "@mui/material"
import { CategoriesAggregation, Prediction } from "./domain"
import { TableFormState } from "./PredictionsTable"
import NumberInput from "../forms/inputs/NumberInput"
import { Check, Close, Edit } from "@mui/icons-material"

interface Props {
  categoriesAggregation: CategoriesAggregation
  prediction: Prediction | null
  formState: TableFormState
  isLoading: boolean
  onValueChange(value: number): void
  onEditButtonClick(): void
  onSaveButtonClick(): void
  onCancel(): void
}

export default function PredictionsTableBodyRow(props: Props) {
  return (
    <TableRow>
      <TableCell>
        {props.categoriesAggregation.categoryName ?? "Uncategorized"}
      </TableCell>
      <TableCell align="right">
        {props.categoriesAggregation.transactionsTotal.toFixed(2)}
      </TableCell>
      <TableCell align="right">
        {(() => {
          switch (props.formState.type) {
            case "idle":
              return (props.prediction?.value ?? 0).toFixed(2)
            case "bulkEditing":
              return (
                <NumberInput
                  name={
                    props.categoriesAggregation.categoryId ?? "uncategorized"
                  }
                  value={props.prediction?.value ?? 0}
                  onChange={props.onValueChange}
                  errorMessage="Should be a number"
                  fieldProps={{
                    sx: { maxWidth: "5em" },
                    disabled: props.isLoading,
                  }}
                />
              )
            case "editing": {
              if (
                props.categoriesAggregation.categoryId ===
                props.formState.subject.categoryId
              ) {
                return (
                  <NumberInput
                    name={
                      props.categoriesAggregation.categoryId ?? "uncategorized"
                    }
                    value={props.prediction?.value ?? 0}
                    onChange={props.onValueChange}
                    errorMessage="The value of a prediction should be a non negative number"
                    fieldProps={{
                      sx: { maxWidth: "5em" },
                      autoFocus: true,
                      disabled: props.isLoading,
                    }}
                  />
                )
              } else {
                return props.prediction?.value ?? 0
              }
            }
          }
        })()}
      </TableCell>
      <TableCell align="right">
        {(
          (props.prediction?.value ?? 0) -
          props.categoriesAggregation.transactionsTotal
        ).toFixed(2)}
      </TableCell>
      <TableCell sx={{ minWidth: 116, maxWidth: 116, width: 116 }}>
        {(() => {
          switch (props.formState.type) {
            case "idle":
              return (
                <IconButton
                  aria-label="Edit"
                  onClick={() => props.onEditButtonClick()}
                  disabled={props.isLoading}
                >
                  <Edit />
                </IconButton>
              )
            case "bulkEditing":
              return <Box height={40} />
            case "editing": {
              if (
                props.categoriesAggregation.categoryId ===
                props.formState.subject.categoryId
              ) {
                return (
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      aria-label="Save"
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
              } else {
                return <Box height={40} />
              }
            }
          }
        })()}
      </TableCell>
    </TableRow>
  )
}
