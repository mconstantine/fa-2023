import * as NetworkResponse from "../../network/NetworkResponse"
import * as S from "@effect/schema/Schema"
import {
  Box,
  IconButton,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material"
import { Either, Option, pipe } from "effect"
import { TableFormState } from "./BudgetsTable"
import { constNull, constTrue, constVoid } from "effect/Function"
import { Add, Check, Close, Delete, Edit } from "@mui/icons-material"
import { useForm } from "../../hooks/useForm"
import TextInput from "../forms/inputs/TextInput"
import { optionStringEq } from "../../globalDomain"
import { CategoryData } from "./mergeTransactionsAndBudgetsByCategory"
import { useCommand } from "../../hooks/network"
import { updateCategoryRequest } from "../categories/api"
import { getProjectionValue } from "./getProjectionValue"

interface Props {
  year: number
  categoryData: CategoryData
  formState: TableFormState
  isLoading: boolean
  onValueChange(value: number): void
  onEditButtonClick(): void
  onSaveButtonClick(): void
  onDeleteButtonClick(): void
  onProjectableStatusUpdate(isProjectable: boolean): void
  onCancel(): void
}

interface Projection {
  value: number
  isBetterThanBudget: boolean
}

export default function BudgetsTableRow(props: Props) {
  const [updatedCategory, updateCategory] = useCommand(updateCategoryRequest)

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

  const shouldShowProjections = props.year === new Date().getUTCFullYear()

  const projection: Option.Option<Projection> = (() => {
    if (shouldShowProjections && props.categoryData.categoryIsProjectable) {
      const budget = pipe(
        props.categoryData.budget,
        Option.map((budget) => budget.value),
        Option.getOrElse(() => props.categoryData.totalTransactionsYearBefore),
      )

      const value = getProjectionValue(props.categoryData)
      const isBetterThanBudget = value >= budget

      return Option.some({ value, isBetterThanBudget })
    } else {
      return Option.none()
    }
  })()

  async function onProjectableStatusUpdate(
    isProjectable: boolean,
  ): Promise<void> {
    await pipe(
      props.categoryData.categoryId,
      Option.match({
        onNone: Promise.resolve,
        onSome: async (categoryId) => {
          const result = await updateCategory({
            params: { id: categoryId },
            body: { is_projectable: isProjectable },
          })

          return pipe(
            result,
            Either.match({
              onLeft: constVoid,
              onRight: (category) =>
                props.onProjectableStatusUpdate(category.is_projectable),
            }),
          )
        },
      }),
    )
  }

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
      <TableCell sx={{ minWidth: 116, maxWidth: 116, width: 116 }}>
        {(() => {
          switch (props.formState.type) {
            case "Idle":
              return (
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="Edit budget">
                    <span>
                      <IconButton
                        aria-label="Edit budget"
                        onClick={props.onEditButtonClick}
                        disabled={props.isLoading}
                      >
                        <Edit />
                      </IconButton>
                    </span>
                  </Tooltip>
                  {pipe(
                    props.categoryData.budget,
                    Option.match({
                      onNone: constNull,
                      onSome: () => (
                        <Tooltip title="Delete budget">
                          <span>
                            <IconButton
                              aria-label="Delete budget"
                              onClick={props.onDeleteButtonClick}
                              disabled={props.isLoading}
                            >
                              <Delete />
                            </IconButton>
                          </span>
                        </Tooltip>
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
                    <Tooltip title="Save budget">
                      <span>
                        <IconButton
                          aria-label="Save budget"
                          onClick={props.onSaveButtonClick}
                          disabled={props.isLoading}
                        >
                          <Check color="primary" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Cancel">
                      <span>
                        <IconButton
                          aria-label="Cancel"
                          onClick={props.onCancel}
                          disabled={props.isLoading}
                        >
                          <Close />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                )
              } else {
                return <Box height={40} />
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
      {shouldShowProjections ? (
        <>
          <TableCell align="right">
            {pipe(
              projection,
              Option.match({
                onNone: () =>
                  props.categoryData.totalTransactionsChosenYear.toFixed(2),
                onSome: (projection) => (
                  <Typography
                    variant="body2"
                    color={projection.isBetterThanBudget ? "success" : "error"}
                  >
                    {projection.value.toFixed(2)}
                  </Typography>
                ),
              }),
            )}
          </TableCell>
          <TableCell sx={{ minWidth: 72, maxWidth: 72, width: 72 }}>
            {Option.isSome(props.categoryData.categoryId) ? (
              props.categoryData.categoryIsProjectable ? (
                <Tooltip title="Delete projection">
                  <span>
                    <IconButton
                      aria-label="Delete projection"
                      onClick={() => onProjectableStatusUpdate(false)}
                      disabled={NetworkResponse.isLoading(updatedCategory)}
                    >
                      <Delete />
                    </IconButton>
                  </span>
                </Tooltip>
              ) : (
                <Tooltip title="Create projection">
                  <span>
                    <IconButton
                      aria-label="Create projection"
                      onClick={() => onProjectableStatusUpdate(true)}
                      disabled={NetworkResponse.isLoading(updatedCategory)}
                    >
                      <Add />
                    </IconButton>
                  </span>
                </Tooltip>
              )
            ) : null}
          </TableCell>
        </>
      ) : null}
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
