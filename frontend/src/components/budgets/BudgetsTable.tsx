import * as S from "effect/String"
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  useTheme,
} from "@mui/material"
import BudgetsTableHead from "./BudgetsTableHead"
import BudgetsTableRow from "./BudgetsTableRow"
import { Option, pipe } from "effect"
import {
  BudgetWithCategory,
  InsertBudgetInput,
  TransactionByCategory,
} from "./domain"
import { useState } from "react"

interface Props {
  year: number
  transactionsByCategory: readonly TransactionByCategory[]
  budgets: readonly BudgetWithCategory[]
  onBudgetUpdate(data: BudgetWithCategory | InsertBudgetInput): void
  // onPredictionsUpdate(
  //   predictions: Array<Prediction | PredictionCreationBody>,
  // ): void
  onBudgetDelete(budget: BudgetWithCategory): void
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
  const [formState, setFormState] = useState<TableFormState>({ type: "Idle" })

  const incomes = props.transactionsByCategory.filter(
    (entry) => entry.transactions_total > 0,
  )

  const outcomes = props.transactionsByCategory.filter(
    (entry) => entry.transactions_total <= 0,
  )

  const rogue = props.budgets
    .filter(
      (budget) =>
        !props.transactionsByCategory.find((entry) =>
          pipe(Option.getEquivalence(S.Equivalence), (eq) =>
            eq(budget.category_id, entry.category_id),
          ),
        ),
    )
    .map<TransactionByCategory>((budget) => ({
      category_id: pipe(
        budget.category,
        Option.map((category) => category.id),
      ),
      category_name: pipe(
        budget.category,
        Option.map((category) => category.name),
      ),
      transactions_total: 0,
    }))

  const transactionsTotal = props.transactionsByCategory.reduce(
    (sum, entry) => sum + entry.transactions_total,
    0,
  )

  const budgetsTotal = props.transactionsByCategory.reduce((sum, entry) => {
    const budget = Option.fromNullable(
      props.budgets.find((budget) =>
        pipe(Option.getEquivalence(S.Equivalence), (eq) =>
          eq(budget.category_id, entry.category_id),
        ),
      ),
    )

    return pipe(
      budget,
      Option.match({
        onNone: () => sum + entry.transactions_total,
        onSome: (budget) => sum + budget.value,
      }),
    )
  }, 0)

  const sorted = [...incomes, ...outcomes, ...rogue]

  function onEditBudgetButtonClick(categoryId: Option.Option<string>): void {
    const subject = pipe(
      Option.fromNullable(
        props.budgets.find((budget) =>
          pipe(Option.getEquivalence(S.Equivalence), (eq) =>
            eq(budget.category_id, categoryId),
          ),
        ),
      ),
      Option.getOrElse(() => {
        const value = pipe(
          Option.fromNullable(
            props.transactionsByCategory.find((entry) =>
              pipe(Option.getEquivalence(S.Equivalence), (eq) =>
                eq(categoryId, entry.category_id),
              ),
            ),
          ),
          Option.map(
            (transactionByCategory) => transactionByCategory.transactions_total,
          ),
          Option.getOrElse(() => 0),
        )

        return {
          year: props.year,
          category_id: categoryId,
          value,
        }
      }),
    )

    setFormState({ type: "Editing", subject })
  }

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

  function onCancelEditing(): void {
    setFormState({ type: "Idle" })
  }

  // async function onBulkSaveButtonClick(): Promise<void> {
  //   if (formState.type === "bulkEditing") {
  //     props.onPredictionsUpdate(formState.subject)
  //     setFormState({ type: "idle" })
  //   }
  // }

  function onBudgetValueChange(
    categoryId: Option.Option<string>,
    value: number,
  ): void {
    setFormState((formState) => {
      switch (formState.type) {
        case "Idle":
          return formState
        case "Editing":
          return {
            ...formState,
            subject: { ...formState.subject, value },
          }
        case "BulkEditing": {
          // TODO:
          return formState
          // return {
          //   ...formState,
          //   subject: formState.subject.map((subject) => {
          //     if (subject.categoryId === categoryId) {
          //       return { ...subject, value }
          //     } else {
          //       return subject
          //     }
          //   }),
          // }
        }
      }
    })
  }

  function onSaveBudgetButtonClick(): void {
    if (formState.type === "Editing") {
      props.onBudgetUpdate(formState.subject)
      setFormState({ type: "Idle" })
    }
  }

  function onDeleteBudgetButtonClick(
    budget: Option.Option<BudgetWithCategory>,
  ): void {
    if (Option.isSome(budget)) {
      props.onBudgetDelete(budget.value)
    }
  }

  return (
    <Paper>
      <TableContainer sx={{ maxHeight: 637 }}>
        <Table stickyHeader>
          <BudgetsTableHead
            year={props.year}
            formState={formState}
            // onEditButtonClick={onBulkEditButtonClick}
            // onSaveButtonClick={onBulkSaveButtonClick}
            // onCancel={onCancelEditing}
            // isLoading={props.isLoading}
          />
          <TableBody>
            {sorted.map((entry) => {
              const budget = Option.fromNullable(
                props.budgets.find((budget) =>
                  pipe(Option.getEquivalence(S.Equivalence), (eq) =>
                    eq(entry.category_id, budget.category_id),
                  ),
                ),
              )

              return (
                <BudgetsTableRow
                  key={Option.getOrNull(entry.category_id)}
                  transactionByCategory={entry}
                  budget={budget}
                  formState={formState}
                  onValueChange={(value) =>
                    onBudgetValueChange(entry.category_id, value)
                  }
                  onEditButtonClick={() =>
                    onEditBudgetButtonClick(entry.category_id)
                  }
                  onSaveButtonClick={onSaveBudgetButtonClick}
                  onDeleteButtonClick={() => onDeleteBudgetButtonClick(budget)}
                  onCancel={onCancelEditing}
                />
              )
            })}
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
