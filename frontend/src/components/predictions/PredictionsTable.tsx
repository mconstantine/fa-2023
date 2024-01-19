import {
  Paper,
  Stack,
  Table,
  TableBody,
  TableContainer,
  Toolbar,
  Typography,
} from "@mui/material"
import {
  CategoriesAggregation,
  Prediction,
  PredictionBulkCreationBody,
  PredictionBulkUpdateBody,
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

/*
TODO:
- Add "delta" table column
- Add "create prediction" button with creatable category select
*/

export default function PredictionsTable(props: Props) {
  const [formState, setFormState] = useState<TableFormState>({ type: "idle" })

  const [createPredictionResponse, createPrediction] = useCommand<
    PredictionCreationBody,
    Prediction
  >("POST", "/predictions/")

  const [createPredictionsResponse, createPredictions] = useCommand<
    PredictionBulkCreationBody,
    Prediction[]
  >("POST", "/predictions/bulk/")

  const [updatePredictionResponse, updatePrediction] = useCommand<
    PredictionUpdateBody,
    Prediction
  >("PATCH", "/predictions/")

  const [updatePredictionsResponse, updatePredictions] = useCommand<
    PredictionBulkUpdateBody,
    Prediction[]
  >("PATCH", "/predictions/bulk/")

  const incomes = props.categoriesAggregation.filter(
    (entry) => entry.transactionsTotal > 0,
  )

  const outcomes = props.categoriesAggregation.filter(
    (entry) => entry.transactionsTotal <= 0,
  )

  const transactionsTotal = props.categoriesAggregation.reduce(
    (sum, entry) => sum + entry.transactionsTotal,
    0,
  )

  const predictionsTotal = props.predictions.reduce(
    (sum, entry) => sum + entry.value,
    0,
  )

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

  async function onBulkSaveButtonClick(): Promise<void> {
    if (formState.type === "bulkEditing") {
      const newPredictions = formState.subject.filter(
        (subject) => !isPrediction(subject),
      ) as PredictionCreationBody[]

      if (newPredictions.length > 0) {
        const result = await createPredictions({
          predictions: newPredictions,
        })

        if (result !== null) {
          props.onPredictionsCreate(result)
        }
      }

      const existingPredictions = formState.subject.filter((subject) =>
        isPrediction(subject),
      ) as Prediction[]

      if (existingPredictions.length > 0) {
        const result = await updatePredictions({
          predictions: existingPredictions,
        })

        if (result !== null) {
          props.onPredictionsUpdate(result)
        }
      }

      setFormState({ type: "idle" })
    }
  }

  function onPredictionValueChange(
    categoryId: string | null,
    value: number,
  ): void {
    setFormState((formState) => {
      switch (formState.type) {
        case "idle":
          return formState
        case "editing":
          return {
            ...formState,
            subject: { ...formState.subject, value },
          }
        case "bulkEditing": {
          return {
            ...formState,
            subject: formState.subject.map((subject) => {
              if (subject.categoryId === categoryId) {
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

  function onSavePredictionButtonClick(): void {
    if (formState.type === "editing") {
      if (isPrediction(formState.subject)) {
        updatePrediction(formState.subject).then((result) => {
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
    createPredictionResponse.isLoading() ||
    updatePredictionResponse.isLoading() ||
    createPredictionsResponse.isLoading() ||
    updatePredictionsResponse.isLoading()

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
      <Toolbar>
        <Stack spacing={1.5} sx={{ mt: 1.5, mb: 1.5 }}>
          <Typography>
            {props.year - 1} transactions total: {transactionsTotal.toFixed(2)}
          </Typography>
          <Typography>
            {props.year} predictions total: {predictionsTotal.toFixed(2)}
          </Typography>
          <Typography>
            Total delta: {(predictionsTotal - transactionsTotal).toFixed(2)}
          </Typography>
        </Stack>
      </Toolbar>
    </Paper>
  )
}
