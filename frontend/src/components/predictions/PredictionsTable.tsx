import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  useTheme,
} from "@mui/material"
import {
  CategoriesAggregation,
  Prediction,
  PredictionCreationBody,
} from "./domain"
import { useState } from "react"
import PredictionsTableHead from "./PredictionsTableHead"
import PredictionsTableBodyRow from "./PredictionsTableBodyRow"

interface Props {
  year: number
  categoriesAggregation: CategoriesAggregation[]
  predictions: Prediction[]
  isLoading: boolean
  onPredictionUpdate(prediction: Prediction | PredictionCreationBody): void
  onPredictionsUpdate(
    predictions: Array<Prediction | PredictionCreationBody>,
  ): void
  onPredictionDelete(prediction: Prediction): void
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
  const theme = useTheme()
  const [formState, setFormState] = useState<TableFormState>({ type: "idle" })

  const incomes = props.categoriesAggregation.filter(
    (entry) => entry.transactionsTotal > 0,
  )

  const outcomes = props.categoriesAggregation.filter(
    (entry) => entry.transactionsTotal <= 0,
  )

  const rogue = props.predictions
    .filter(
      (prediction) =>
        !props.categoriesAggregation.find(
          (aggregation) => aggregation.categoryId === prediction.categoryId,
        ),
    )
    .map<CategoriesAggregation>((prediction) => ({
      categoryId: prediction.category.id,
      categoryName: prediction.category.name,
      transactionsTotal: 0,
    }))

  const transactionsTotal = props.categoriesAggregation.reduce(
    (sum, entry) => sum + entry.transactionsTotal,
    0,
  )

  const predictionsTotal = props.predictions.reduce(
    (sum, entry) => sum + entry.value,
    0,
  )

  const sorted = [...incomes, ...outcomes, ...rogue]

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
      props.onPredictionsUpdate(formState.subject)
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
      props.onPredictionUpdate(formState.subject)
      setFormState({ type: "idle" })
    }
  }

  function onDeletePredictionButtonClick(categoryId: string | null) {
    const prediction = props.predictions.find(
      (prediction) => prediction.categoryId === categoryId,
    )

    if (typeof prediction !== "undefined") {
      props.onPredictionDelete(prediction)
    }
  }

  return (
    <Paper>
      <TableContainer sx={{ maxHeight: 637 }}>
        <Table stickyHeader>
          <PredictionsTableHead
            year={props.year}
            formState={formState}
            onEditButtonClick={onBulkEditButtonClick}
            onSaveButtonClick={onBulkSaveButtonClick}
            onCancel={onCancelEditing}
            isLoading={props.isLoading}
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
                onDeleteButtonClick={() =>
                  onDeletePredictionButtonClick(
                    categoriesAggregation.categoryId,
                  )
                }
                onCancel={onCancelEditing}
                isLoading={props.isLoading}
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
              <TableCell align="right">{predictionsTotal.toFixed(2)}</TableCell>
              <TableCell align="right">
                {(predictionsTotal + transactionsTotal).toFixed(2)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}
