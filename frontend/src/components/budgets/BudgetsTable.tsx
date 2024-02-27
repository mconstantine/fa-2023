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
import { BudgetWithCategory, InsertBudgetInput } from "./domain"
import { useState } from "react"
import { optionStringEq } from "../../globalDomain"
import { CategoryData } from "./mergeTransactionsAndBudgetsByCategory"
import { getProjectionValue } from "./getProjectionValue"

interface Props {
  year: number
  categories: readonly CategoryData[]
  isLoading: boolean
  onBudgetUpdate(data: BudgetWithCategory | InsertBudgetInput): void
  onBudgetsUpdate(data: Array<BudgetWithCategory | InsertBudgetInput>): void
  onBudgetDelete(budget: BudgetWithCategory): void
  onProjectableStatusUpdate(categoryId: string, isProjectable: boolean): void
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

  const incomes = props.categories.filter(
    (entry) =>
      entry.totalTransactionsChosenYear > 0 &&
      entry.totalTransactionsYearBefore > 0,
  )

  const outcomes = props.categories.filter(
    (entry) =>
      entry.totalTransactionsChosenYear <= 0 ||
      entry.totalTransactionsYearBefore <= 0,
  )

  const transactionsTotalYearBefore = props.categories.reduce(
    (sum, entry) => sum + entry.totalTransactionsYearBefore,
    0,
  )

  const transactionsTotalChosenYear = props.categories.reduce(
    (sum, entry) => sum + entry.totalTransactionsChosenYear,
    0,
  )

  const budgetsTotal = props.categories.reduce(
    (sum, entry) =>
      sum +
      pipe(
        entry.budget,
        Option.map((budget) => budget.value),
        Option.getOrElse(() => entry.totalTransactionsYearBefore),
      ),
    0,
  )

  const projectionsTotal = props.categories.reduce(
    (sum, entry) => sum + getProjectionValue(entry),
    0,
  )

  const sorted = [...incomes, ...outcomes]

  function onEditBudgetButtonClick(categoryData: CategoryData): void {
    setFormState({
      type: "Editing",
      subject: pipe(
        categoryData.budget,
        Option.getOrElse(() => ({
          year: props.year,
          category_id: categoryData.categoryId,
          value: categoryData.totalTransactionsYearBefore,
        })),
      ),
    })
  }

  function onBulkEditButtonClick() {
    const budgets = props.categories.map<
      BudgetWithCategory | InsertBudgetInput
    >((entry) =>
      pipe(
        entry.budget,
        Option.getOrElse(() => ({
          year: props.year,
          value: entry.totalTransactionsYearBefore,
          category_id: entry.categoryId,
        })),
      ),
    )

    setFormState({
      type: "BulkEditing",
      subject: budgets,
    })
  }

  function onCancelEditing(): void {
    setFormState({ type: "Idle" })
  }

  async function onBulkSaveButtonClick(): Promise<void> {
    if (formState.type === "BulkEditing") {
      props.onBudgetsUpdate(formState.subject)
      setFormState({ type: "Idle" })
    }
  }

  function onBudgetValueChange(
    categoryData: CategoryData,
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
          return {
            ...formState,
            subject: formState.subject.map((subject) => {
              if (
                optionStringEq(subject.category_id, categoryData.categoryId)
              ) {
                return { ...subject, value }
              } else {
                return subject
              }
            }),
          }
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

  function onDeleteBudgetButtonClick(categoryData: CategoryData): void {
    if (Option.isSome(categoryData.budget)) {
      props.onBudgetDelete(categoryData.budget.value)
    }
  }

  function onProjectableStatusUpdate(
    entry: CategoryData,
    isProjectable: boolean,
  ) {
    if (Option.isSome(entry.categoryId)) {
      props.onProjectableStatusUpdate(entry.categoryId.value, isProjectable)
    }
  }

  return (
    <Paper>
      <TableContainer sx={{ maxHeight: 637 }}>
        <Table stickyHeader>
          <BudgetsTableHead
            year={props.year}
            formState={formState}
            onEditButtonClick={onBulkEditButtonClick}
            onSaveButtonClick={onBulkSaveButtonClick}
            onCancel={onCancelEditing}
            isLoading={props.isLoading}
          />
          <TableBody>
            {sorted.map((entry) => {
              return (
                <BudgetsTableRow
                  key={Option.getOrNull(entry.categoryId)}
                  year={props.year}
                  categoryData={entry}
                  formState={formState}
                  onValueChange={(value) => onBudgetValueChange(entry, value)}
                  onEditButtonClick={() => onEditBudgetButtonClick(entry)}
                  onSaveButtonClick={onSaveBudgetButtonClick}
                  onDeleteButtonClick={() => onDeleteBudgetButtonClick(entry)}
                  onCancel={onCancelEditing}
                  onProjectableStatusUpdate={(isProjectable) =>
                    onProjectableStatusUpdate(entry, isProjectable)
                  }
                  isLoading={props.isLoading}
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
                {transactionsTotalYearBefore.toFixed(2)}
              </TableCell>
              <TableCell align="right">{budgetsTotal.toFixed(2)}</TableCell>
              <TableCell />
              <TableCell align="right">
                {(budgetsTotal + transactionsTotalYearBefore).toFixed(2)}
              </TableCell>
              <TableCell align="right">
                {transactionsTotalChosenYear.toFixed(2)}
              </TableCell>
              {props.year === new Date().getUTCFullYear() ? (
                <>
                  <TableCell align="right">
                    {projectionsTotal.toFixed(2)}
                  </TableCell>
                  <TableCell />
                </>
              ) : null}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}
