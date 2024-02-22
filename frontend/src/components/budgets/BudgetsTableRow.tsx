import { TableCell, TableRow } from "@mui/material"
import { TransactionByCategory } from "../../../../backend/src/database/functions/transaction/domain"
import { BudgetWithCategory } from "../../../../backend/src/database/functions/budget/domain"
import { Option, pipe } from "effect"
import { TableFormState } from "./BudgetsTable"

interface Props {
  transactionByCategory: TransactionByCategory
  budget: Option.Option<BudgetWithCategory>
  formState: TableFormState
  // onValueChange(value: number): void
  // onEditButtonClick(): void
  // onSaveButtonClick(): void
  // onDeleteButtonClick(): void
  // onCancel(): void
}

export default function BudgetsTableRow(props: Props) {
  return (
    <TableRow>
      <TableCell>
        {props.transactionByCategory.category_name ?? "Uncategorized"}
      </TableCell>
      <TableCell align="right">
        {props.transactionByCategory.transactions_total.toFixed(2)}
      </TableCell>
      <TableCell align="right">
        {(() => {
          switch (props.formState.type) {
            case "Idle":
              return pipe(
                props.budget,
                Option.map((budget) => budget.value),
                Option.getOrElse(
                  () => props.transactionByCategory.transactions_total,
                ),
                (n) => n.toFixed(2),
              )
            case "BulkEditing":
              return null
            // return (
            //   <NumberInput
            //     name={
            //       props.categoriesAggregation.categoryId ?? "uncategorized"
            //     }
            //     value={props.prediction?.value ?? 0}
            //     onChange={props.onValueChange}
            //     errorMessage="Should be a number"
            //     fieldProps={{
            //       sx: { maxWidth: "5em" },
            //       disabled: props.isLoading,
            //     }}
            //   />
            // )
            case "Editing": {
              return null
              // if (
              //   props.categoriesAggregation.categoryId ===
              //   props.formState.subject.categoryId
              // ) {
              //   return (
              //     <NumberInput
              //       name={
              //         props.categoriesAggregation.categoryId ?? "uncategorized"
              //       }
              //       value={props.prediction?.value ?? 0}
              //       onChange={props.onValueChange}
              //       errorMessage="The value of a prediction should be a non negative number"
              //       fieldProps={{
              //         sx: { maxWidth: "5em" },
              //         autoFocus: true,
              //         disabled: props.isLoading,
              //       }}
              //     />
              //   )
              // } else {
              //   return props.prediction?.value ?? 0
              // }
            }
          }
        })()}
      </TableCell>
      <TableCell align="right">
        {pipe(
          props.budget,
          Option.map(
            (budget) =>
              budget.value - props.transactionByCategory.transactions_total,
          ),
          Option.getOrElse(() => 0),
          (n) => n.toFixed(2),
        )}
      </TableCell>
      <TableCell sx={{ minWidth: 116, maxWidth: 116, width: 116 }}>
        {/* {(() => {
          switch (props.formState.type) {
            case "idle":
              return (
                <Stack direction="row" spacing={0.5}>
                  <IconButton
                    aria-label="Edit"
                    onClick={() => props.onEditButtonClick()}
                    disabled={props.isLoading}
                  >
                    <Edit />
                  </IconButton>
                  {props.prediction !== null ? (
                    <IconButton
                      aria-label="Delete"
                      onClick={() => props.onDeleteButtonClick()}
                      disabled={props.isLoading}
                    >
                      <Delete />
                    </IconButton>
                  ) : null}
                </Stack>
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
        })()} */}
      </TableCell>
    </TableRow>
  )
}
