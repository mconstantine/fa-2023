import { Box, IconButton, Stack, TableCell, TableRow } from "@mui/material"
import { CategoriesAggregation, Prediction, isPrediction } from "./domain"
import { TableFormState } from "./PredictionsTable"
import NonNegativeNumberInput from "../forms/inputs/NonNegativeNumberInput"
import { Check, Close, Edit } from "@mui/icons-material"

interface Props {
  categoriesAggregation: CategoriesAggregation
  prediction: Prediction | null
  formState: TableFormState
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
              return props.prediction?.value ?? 0
            case "bulkEditing":
              return (
                <NonNegativeNumberInput
                  name={
                    props.categoriesAggregation.categoryId ?? "uncategorized"
                  }
                  value={props.prediction?.value ?? 0}
                  onChange={props.onValueChange}
                  errorMessage="The value of a prediction should be a non negative number"
                  fieldProps={{ sx: { maxWidth: "5em" } }}
                />
              )
            case "editing": {
              const categoryId = isPrediction(props.formState.subject)
                ? props.formState.subject.category.id
                : props.formState.subject.categoryId

              if (props.categoriesAggregation.categoryId === categoryId) {
                return (
                  <NonNegativeNumberInput
                    name={
                      props.categoriesAggregation.categoryId ?? "uncategorized"
                    }
                    // label?
                    value={props.prediction?.value ?? 0}
                    onChange={props.onValueChange}
                    errorMessage="The value of a prediction should be a non negative number"
                    fieldProps={{ sx: { maxWidth: "5em" } }}
                  />
                )
              } else {
                return props.prediction?.value ?? 0
              }
            }
          }
        })()}
      </TableCell>
      <TableCell sx={{ minWidth: 116, maxWidth: 116, width: 116 }}>
        {(() => {
          switch (props.formState.type) {
            case "idle":
              return (
                <IconButton
                  aria-label="Edit"
                  onClick={() => props.onEditButtonClick()}
                >
                  <Edit />
                </IconButton>
              )
            case "bulkEditing":
              return <Box height={40} />
            case "editing": {
              const categoryId = isPrediction(props.formState.subject)
                ? props.formState.subject.category.id
                : props.formState.subject.categoryId

              if (props.categoriesAggregation.categoryId === categoryId) {
                return (
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      aria-label="Save"
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
