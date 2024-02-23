import * as Str from "effect/String"
import * as S from "@effect/schema/Schema"
import { Box, IconButton, Stack, TableCell, TableRow } from "@mui/material"
import { Either, Option, pipe } from "effect"
import { TableFormState } from "./BudgetsTable"
import { BudgetWithCategory, TransactionByCategory } from "./domain"
import { constNull, constTrue, constVoid } from "effect/Function"
import { Check, Close, Delete, Edit } from "@mui/icons-material"
import { useForm } from "../../hooks/useForm"
import TextInput from "../forms/inputs/TextInput"

interface Props {
  transactionByCategory: TransactionByCategory
  budget: Option.Option<BudgetWithCategory>
  formState: TableFormState
  onValueChange(value: number): void
  onEditButtonClick(): void
  onSaveButtonClick(): void
  onDeleteButtonClick(): void
  onCancel(): void
}

export default function BudgetsTableRow(props: Props) {
  const budgetValue = pipe(
    props.budget,
    Option.map((budget) => budget.value),
    Option.getOrElse(() => props.transactionByCategory.transactions_total),
  )

  const isFormStateSubject = pipe(
    Option.getEquivalence(Str.Equivalence),
    (eq) =>
      props.formState.type === "Editing" &&
      eq(
        props.transactionByCategory.category_id,
        props.formState.subject.category_id,
      ),
  )

  return (
    <TableRow>
      <TableCell>
        {pipe(
          props.transactionByCategory.category_name,
          Option.getOrElse(() => "Uncategorized"),
        )}
      </TableCell>
      <TableCell align="right">
        {props.transactionByCategory.transactions_total.toFixed(2)}
      </TableCell>
      <TableCell align="right">
        {(() => {
          switch (props.formState.type) {
            case "Idle":
              return budgetValue.toFixed(2)
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
              if (isFormStateSubject) {
                return (
                  <BudgetsTableRowForm
                    type="Single"
                    value={budgetValue}
                    onValueChange={props.onValueChange}
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
        {(() => {
          switch (props.formState.type) {
            case "Idle":
              return (
                <Stack direction="row" spacing={0.5}>
                  <IconButton
                    aria-label="Edit"
                    onClick={props.onEditButtonClick}
                  >
                    <Edit />
                  </IconButton>
                  {pipe(
                    props.budget,
                    Option.match({
                      onNone: constNull,
                      onSome: () => (
                        <IconButton
                          aria-label="Delete"
                          onClick={props.onDeleteButtonClick}
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
                    >
                      <Check color="primary" />
                    </IconButton>
                    <IconButton aria-label="Cancel" onClick={props.onCancel}>
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
      }}
    />
  )
}
