import {
  Paper,
  Table,
  TableBody,
  TableContainer,
  Toolbar,
  Typography,
} from "@mui/material"
import {
  CategoriesAggregation,
  Prediction,
  PredictionCreationBody,
  isPrediction,
} from "./domain"
import { useState } from "react"
import PredictionsTableHead from "./PredictionsTableHead"
import PredictionsTableBodyRow from "./PredictionsTableBodyRow"

interface Props {
  year: number
  categoriesAggregation: CategoriesAggregation[]
  predictions: Prediction[]
}

interface IdleTableFormState {
  type: "idle"
}

interface EditingTableFormState {
  type: "editing"
  subject: Prediction | PredictionCreationBody
}

interface BulkEditingTableFormState {
  type: "bulkEditing"
  subject: Array<Prediction | PredictionCreationBody>
}

export type TableFormState =
  | IdleTableFormState
  | EditingTableFormState
  | BulkEditingTableFormState

/*
TODO:
- Follow the todos in here
*/
export default function PredictionsTable(props: Props) {
  const [formState, setFormState] = useState<TableFormState>({ type: "idle" })

  const incomes = props.categoriesAggregation.filter(
    (entry) => entry.transactionsTotal > 0,
  )

  const outcomes = props.categoriesAggregation.filter(
    (entry) => entry.transactionsTotal <= 0,
  )

  const total = props.categoriesAggregation
    .reduce((sum, entry) => sum + entry.transactionsTotal, 0)
    .toFixed(2)

  const sorted = [...incomes, ...outcomes]

  function onEditPredictionButtonClick(categoryId: string | null): void {
    const existingPrediction = props.predictions.find(
      (prediction) => prediction.category.id === categoryId,
    )

    if (typeof existingPrediction === "undefined") {
      setFormState({
        type: "editing",
        subject: {
          year: props.year,
          value: 0,
          categoryId,
        } satisfies PredictionCreationBody,
      })
    } else {
      setFormState({
        type: "editing",
        subject: existingPrediction,
      })
    }
  }

  function onBulkEditButtonClick() {
    const predictions = props.categoriesAggregation.map<
      Prediction | PredictionCreationBody
    >((entry) => {
      const existingPrediction = props.predictions.find(
        (prediction) => prediction.category.id === entry.categoryId,
      )

      if (typeof existingPrediction === "undefined") {
        return {
          year: props.year,
          value: 0,
          categoryId: entry.categoryId,
        }
      } else {
        return existingPrediction
      }
    })

    setFormState({
      type: "bulkEditing",
      subject: predictions,
    })
  }

  function onCancelEditing(): void {
    setFormState({ type: "idle" })
  }

  function onBulkSaveButtonClick(): void {
    if (formState.type === "bulkEditing") {
      console.log("TODO: save all", formState.subject)
    }
  }

  function onPredictionValueChange(
    categoryId: string | null,
    value: number,
  ): void {
    switch (formState.type) {
      case "idle":
        return
      case "editing":
        return setFormState({
          ...formState,
          subject: { ...formState.subject, value },
        })
      case "bulkEditing": {
        setFormState({
          ...formState,
          subject: formState.subject.map((subject) => {
            const subjectCategoryId = isPrediction(subject)
              ? subject.category.id
              : subject.categoryId

            if (subjectCategoryId === categoryId) {
              return { ...subject, value }
            } else {
              return subject
            }
          }),
        })
      }
    }
  }

  function onSavePredictionButtonClick(): void {
    if (formState.type === "editing") {
      console.log("TODO: save one", formState.subject)
    }
  }

  return (
    <Paper>
      <TableContainer sx={{ maxHeight: 587 }}>
        <Table stickyHeader>
          <PredictionsTableHead
            year={props.year}
            formState={formState}
            onEditButtonClick={onBulkEditButtonClick}
            onSaveButtonClick={onBulkSaveButtonClick}
            onCancel={onCancelEditing}
          />
          <TableBody>
            {sorted.map((categoriesAggregation) => (
              <PredictionsTableBodyRow
                key={categoriesAggregation.categoryId}
                categoriesAggregation={categoriesAggregation}
                prediction={
                  props.predictions.find(
                    (prediction) =>
                      prediction.category.id ===
                      categoriesAggregation.categoryId,
                  ) ?? null
                }
                formState={formState}
                onValueChange={(value) =>
                  onPredictionValueChange(
                    categoriesAggregation.categoryId,
                    value,
                  )
                }
                onEditButtonClick={() =>
                  onEditPredictionButtonClick(categoriesAggregation.categoryId)
                }
                onSaveButtonClick={onSavePredictionButtonClick}
                onCancel={onCancelEditing}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Toolbar sx={{ justifyContent: "end" }}>
        <Typography>Total: {total}</Typography>
      </Toolbar>
    </Paper>
  )
}
