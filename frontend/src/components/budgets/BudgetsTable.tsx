import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  useTheme,
} from "@mui/material"
import { TransactionByCategory } from "../../../../backend/src/database/functions/transaction/domain"
import { BudgetWithCategory } from "../../../../backend/src/database/functions/budget/domain"
import BudgetsTableHead from "./BudgetsTableHead"
import BudgetsTableRow from "./BudgetsTableRow"
import { Option } from "effect"
import { InsertBudgetInput } from "./domain"
import { useState } from "react"

interface Props {
  year: number
  transactionsByCategory: readonly TransactionByCategory[]
  budgets: readonly BudgetWithCategory[]
  // onPredictionUpdate(prediction: Prediction | PredictionCreationBody): void
  // onPredictionsUpdate(
  //   predictions: Array<Prediction | PredictionCreationBody>,
  // ): void
  // onPredictionDelete(prediction: Prediction): void
}

interface IdleTableFormState {
  readonly type: "Idle"
}

interface EditingTableFormState {
  readonly type: "Editing"
  subject: BudgetWithCategory | InsertBudgetInput
}

interface BulkEditingTableFormState {
  readonly type: "BulkEditing"
  subject: Array<BudgetWithCategory | InsertBudgetInput>
}

export type TableFormState =
  | IdleTableFormState
  | EditingTableFormState
  | BulkEditingTableFormState

export default function BudgetsTable(props: Props) {
  const theme = useTheme()
  const [formState] = useState<TableFormState>({ type: "Idle" })

  const incomes = props.transactionsByCategory.filter(
    (entry) => entry.transactions_total > 0,
  )

  const outcomes = props.transactionsByCategory.filter(
    (entry) => entry.transactions_total <= 0,
  )

  const rogue = props.budgets
    .filter(
      (budget) =>
        !props.transactionsByCategory.find(
          (entry) => entry.category_id === budget.category_id,
        ),
    )
    .map<TransactionByCategory>((budget) => ({
      category_id: budget.category?.id ?? null,
      category_name: budget.category?.name ?? null,
      transactions_total: 0,
    }))

  const transactionsTotal = props.transactionsByCategory.reduce(
    (sum, entry) => sum + entry.transactions_total,
    0,
  )

  const budgetsTotal = props.transactionsByCategory.reduce((sum, entry) => {
    const budget = props.budgets.find(
      (budget) => budget.category_id === entry.category_id,
    )

    if (typeof budget !== "undefined") {
      return sum + budget.value
    } else {
      return sum + entry.transactions_total
    }
  }, 0)

  const sorted = [...incomes, ...outcomes, ...rogue]

  // function onEditPredictionButtonClick(categoryId: string | null): void {
  //   const existingPrediction = props.predictions.find(
  //     (prediction) => prediction.categoryId === categoryId,
  //   )

  //   if (typeof existingPrediction === "undefined") {
  //     setFormState({
  //       type: "editing",
  //       subject: {
  //         year: props.year,
  //         value: 0,
  //         categoryId,
  //       } satisfies PredictionCreationBody,
  //     })
  //   } else {
  //     setFormState({
  //       type: "editing",
  //       subject: existingPrediction,
  //     })
  //   }
  // }

  // function onBulkEditButtonClick() {
  //   const predictions = props.categoriesAggregation.map<
  //     Prediction | PredictionCreationBody
  //   >((entry) => {
  //     const existingPrediction = props.predictions.find(
  //       (prediction) => prediction.categoryId === entry.categoryId,
  //     )

  //     if (typeof existingPrediction === "undefined") {
  //       return {
  //         year: props.year,
  //         value: 0,
  //         ...(entry.categoryId === null
  //           ? {}
  //           : { categoryId: entry.categoryId }),
  //       }
  //     } else {
  //       return existingPrediction
  //     }
  //   })

  //   setFormState({
  //     type: "bulkEditing",
  //     subject: predictions,
  //   })
  // }

  // function onCancelEditing(): void {
  //   setFormState({ type: "idle" })
  // }

  // async function onBulkSaveButtonClick(): Promise<void> {
  //   if (formState.type === "bulkEditing") {
  //     props.onPredictionsUpdate(formState.subject)
  //     setFormState({ type: "idle" })
  //   }
  // }

  // function onPredictionValueChange(
  //   categoryId: string | null,
  //   value: number,
  // ): void {
  //   setFormState((formState) => {
  //     switch (formState.type) {
  //       case "idle":
  //         return formState
  //       case "editing":
  //         return {
  //           ...formState,
  //           subject: { ...formState.subject, value },
  //         }
  //       case "bulkEditing": {
  //         return {
  //           ...formState,
  //           subject: formState.subject.map((subject) => {
  //             if (subject.categoryId === categoryId) {
  //               return { ...subject, value }
  //             } else {
  //               return subject
  //             }
  //           }),
  //         }
  //       }
  //     }
  //   })
  // }

  // function onSavePredictionButtonClick(): void {
  //   if (formState.type === "editing") {
  //     props.onPredictionUpdate(formState.subject)
  //     setFormState({ type: "idle" })
  //   }
  // }

  // function onDeletePredictionButtonClick(categoryId: string | null) {
  //   const prediction = props.predictions.find(
  //     (prediction) => prediction.categoryId === categoryId,
  //   )

  //   if (typeof prediction !== "undefined") {
  //     props.onPredictionDelete(prediction)
  //   }
  // }

  return (
    <Paper>
      <TableContainer sx={{ maxHeight: 637 }}>
        <Table stickyHeader>
          <BudgetsTableHead
            year={props.year}
            // formState={formState}
            // onEditButtonClick={onBulkEditButtonClick}
            // onSaveButtonClick={onBulkSaveButtonClick}
            // onCancel={onCancelEditing}
            // isLoading={props.isLoading}
          />
          <TableBody>
            {sorted.map((entry) => (
              <BudgetsTableRow
                key={entry.category_id}
                transactionByCategory={entry}
                budget={Option.fromNullable(
                  props.budgets.find(
                    (budget) => budget.category_id === entry.category_id,
                  ),
                )}
                formState={formState}
                // onValueChange={(value) =>
                //   onPredictionValueChange(
                //     entry.categoryId,
                //     value,
                //   )
                // }
                // onEditButtonClick={() =>
                //   onEditPredictionButtonClick(entry.categoryId)
                // }
                // onSaveButtonClick={onSavePredictionButtonClick}
                // onDeleteButtonClick={() =>
                //   onDeletePredictionButtonClick(
                //     entry.categoryId,
                //   )
                // }
                // onCancel={onCancelEditing}
                // isLoading={props.isLoading}
              />
            ))}
            <TableRow
              sx={{
                position: "sticky",
                bottom: 0,
                backgroundColor: theme.palette.background.default,
              }}
            >
              <TableCell>Total</TableCell>
              <TableCell align="right">
                {transactionsTotal.toFixed(2)}
              </TableCell>
              <TableCell align="right">{budgetsTotal.toFixed(2)}</TableCell>
              <TableCell align="right">
                {(budgetsTotal + transactionsTotal).toFixed(2)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}
