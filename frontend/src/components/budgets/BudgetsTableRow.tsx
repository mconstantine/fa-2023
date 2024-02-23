import * as S from "@effect/schema/Schema"
import { Box, IconButton, Stack, TableCell, TableRow } from "@mui/material"
import { Either, Option, pipe } from "effect"
import { TableFormState } from "./BudgetsTable"
import { constNull, constTrue, constVoid } from "effect/Function"
import { Check, Close, Delete, Edit } from "@mui/icons-material"
import { useForm } from "../../hooks/useForm"
import TextInput from "../forms/inputs/TextInput"
import { optionStringEq } from "../../globalDomain"
import { CategoryData } from "./mergeTransactionsAndBudgetsByCategory"

interface Props {
  categoryData: CategoryData
  formState: TableFormState
  isLoading: boolean
  onValueChange(value: number): void
  onEditButtonClick(): void
  onSaveButtonClick(): void
  onDeleteButtonClick(): void
  onCancel(): void
}

export default function BudgetsTableRow(props: Props) {
  const budgetValue = pipe(
    props.categoryData.budget,
    Option.map((budget) => budget.value),
    Option.getOrElse(() => props.categoryData.totalTransactionsYearBefore),
  )

  const isFormStateSubject =
    props.formState.type === "Editing" &&
    optionStringEq(
      props.categoryData.categoryId,
      props.formState.subject.category_id,
    )

  return (
    <TableRow>
      <TableCell>
        {pipe(
          props.categoryData.categoryName,
          Option.getOrElse(() => "Uncategorized"),
        )}
      </TableCell>
      <TableCell align="right">
        {props.categoryData.totalTransactionsYearBefore.toFixed(2)}
      </TableCell>
      <TableCell align="right">
        {(() => {
          switch (props.formState.type) {
            case "Idle":
              return budgetValue.toFixed(2)
            case "BulkEditing":
              return (
                <BudgetsTableRowForm
                  type="Bulk"
                  value={budgetValue}
                  onValueChange={props.onValueChange}
                  isLoading={props.isLoading}
                />
              )
            case "Editing": {
              if (isFormStateSubject) {
                return (
                  <BudgetsTableRowForm
                    type="Single"
                    value={budgetValue}
                    onValueChange={props.onValueChange}
                    isLoading={props.isLoading}
                  />
                )
              } else {
                return budgetValue.toFixed(2)
              }
            }
          }
        })()}
      </TableCell>
      <TableCell align="right">
        {pipe(
          props.categoryData.budget,
          Option.map(
            (budget) =>
              budget.value - props.categoryData.totalTransactionsYearBefore,
          ),
          Option.getOrElse(() => 0),
          (n) => n.toFixed(2),
        )}
      </TableCell>
      <TableCell align="right">
        {props.categoryData.totalTransactionsChosenYear.toFixed(2)}
      </TableCell>
      <TableCell sx={{ minWidth: 116, maxWidth: 116, width: 116 }}>
        {(() => {
          switch (props.formState.type) {
            case "Idle":
              return (
                <Stack direction="row" spacing={0.5}>
                  <IconButton
                    aria-label="Edit"
                    onClick={props.onEditButtonClick}
                    disabled={props.isLoading}
                  >
                    <Edit />
                  </IconButton>
                  {pipe(
                    props.categoryData.budget,
                    Option.match({
                      onNone: constNull,
                      onSome: () => (
                        <IconButton
                          aria-label="Delete"
                          onClick={props.onDeleteButtonClick}
                          disabled={props.isLoading}
                        >
                          <Delete />
                        </IconButton>
                      ),
                    }),
                  )}
                </Stack>
              )
            case "BulkEditing":
              return <Box height={40} />
            case "Editing": {
              if (isFormStateSubject) {
                return (
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      aria-label="Save"
                      onClick={props.onSaveButtonClick}
                      disabled={props.isLoading}
                    >
                      <Check color="primary" />
                    </IconButton>
                    <IconButton
                      aria-label="Cancel"
                      onClick={props.onCancel}
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

interface BudgetsTableRowFormProps {
  type: "Single" | "Bulk"
  value: number
  isLoading: boolean
  onValueChange(value: number): void
}

function BudgetsTableRowForm(props: BudgetsTableRowFormProps) {
  const { inputProps } = useForm({
    initialValues: {
      value: props.value,
    },
    validators: {
      value: S.NumberFromString.pipe(
        S.filter(constTrue, { message: () => "Should be a number" }),
      ),
    },
    submit: constVoid,
  })

  function onChange(value: string) {
    const validation = inputProps("value").onChange(value)

    pipe(
      validation,
      Either.match({
        onLeft: constVoid,
        onRight: props.onValueChange,
      }),
    )

    return validation
  }

  return (
    <TextInput
      {...inputProps("value")}
      onChange={onChange}
      fieldProps={{
        sx: { maxWidth: "5em" },
        autoFocus: props.type === "Single",
        disabled: props.isLoading,
      }}
    />
  )
}
