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
  PredictionUpdateBody,
  isPrediction,
} from "./domain"
import { useState } from "react"
import PredictionsTableHead from "./PredictionsTableHead"
import PredictionsTableBodyRow from "./PredictionsTableBodyRow"
import { useCommand } from "../../hooks/network"

interface Props {
  year: number
  categoriesAggregation: CategoriesAggregation[]
  predictions: Prediction[]
  onPredictionsCreate(predictions: Prediction[]): void
  onPredictionsUpdate(predictions: Prediction[]): void
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

export default function PredictionsTable(props: Props) {
  const [formState, setFormState] = useState<TableFormState>({ type: "idle" })

  const [createPredictionResponse, createPrediction] = useCommand<
    PredictionCreationBody,
    Prediction
  >("POST", "/predictions/")

  const [updatePredictionResponse, updatePrediction] = useCommand<
    PredictionUpdateBody,
    Prediction
  >("PATCH", "/predictions/")

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
      (prediction) => prediction.categoryId === categoryId,
    )

    if (typeof existingPrediction === "undefined") {
      setFormState({
        type: "editing",
        subject: {
          year: props.year,
          value: 0,
          ...(categoryId === null ? {} : { categoryId }),
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
        (prediction) => prediction.categoryId === entry.categoryId,
      )

      if (typeof existingPrediction === "undefined") {
        return {
          year: props.year,
          value: 0,
          ...(entry.categoryId === null
            ? {}
            : { categoryId: entry.categoryId }),
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
            if (subject.categoryId === categoryId) {
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
      if (isPrediction(formState.subject)) {
        const { categoryId, ...prediction } = formState.subject

        updatePrediction({
          ...prediction,
          ...(categoryId === null ? {} : { categoryId }),
        }).then((result) => {
          if (result !== null) {
            props.onPredictionsUpdate([result])
            setFormState({ type: "idle" })
          }
        })
      } else {
        createPrediction(formState.subject).then((result) => {
          if (result !== null) {
            props.onPredictionsCreate([result])
            setFormState({ type: "idle" })
          }
        })
      }
    }
  }

  const isLoading =
    createPredictionResponse.isLoading() || updatePredictionResponse.isLoading()

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
            isLoading={isLoading}
          />
          <TableBody>
            {sorted.map((categoriesAggregation) => (
              <PredictionsTableBodyRow
                key={categoriesAggregation.categoryId}
                categoriesAggregation={categoriesAggregation}
                prediction={
                  props.predictions.find(
                    (prediction) =>
                      prediction.categoryId ===
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
                isLoading={isLoading}
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
