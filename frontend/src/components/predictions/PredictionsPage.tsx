import { useMemo, useState } from "react"
import { useCommand, useQuery } from "../../hooks/network"
import {
  CategoriesAggregation,
  CategoriesAggregationParams,
  Prediction,
  PredictionBulkCreationBody,
  PredictionBulkUpdateBody,
  PredictionCreationBody,
  PredictionUpdateBody,
  isPrediction,
} from "./domain"
import {
  Button,
  Container,
  Dialog,
  DialogContent,
  Paper,
  Stack,
  Typography,
} from "@mui/material"
import Query from "../Query"
import PredictionsTable from "./PredictionsTable"
import ValidatedSelect from "../forms/inputs/ValidatedSelect"
import { networkResponse } from "../../network/NetworkResponse"
import PredictionCreationForm from "./PredictionCreationForm"

export default function PredictionsPage() {
  const [params, setParams] = useState<CategoriesAggregationParams>({
    year: new Date().getFullYear() - 1,
  })

  const [creationDialogIsOpen, setCreationDialogOpen] = useState(false)

  const [categoriesAggregation] = useQuery<
    CategoriesAggregationParams,
    CategoriesAggregation[]
  >("/transactions/categories/", params)

  const [predictionsList, updatePredictionsList] = useQuery<Prediction[]>(
    `/predictions/${(params.year + 1).toString(10)}`,
  )

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

  const [deletePredictionResponse, deletePrediction] = useCommand<
    Prediction,
    Prediction
  >("DELETE", "/predictions/")

  const [years, labels]: [Record<string, string>, Record<string, string>] =
    useMemo(() => {
      const min = 2023
      const max = new Date().getFullYear()

      const optionsList = new Array(max - min)
        .fill(null)
        .map((_, index) => min + index)

      const options = optionsList.reduce((result, year) => {
        result[year.toString(10)] = year.toString(10)
        return result
      }, {} as Record<string, string>)

      const labels = optionsList.reduce((result, year) => {
        result[year.toString(10)] = `${year.toString(10)}/${(year + 1).toString(
          10,
        )}`
        return result
      }, {} as Record<string, string>)

      return [options, labels]
    }, [])

  function onYearChange(yearString: string): void {
    const year = parseInt(yearString)

    if (!Number.isNaN(year)) {
      setParams({ year })
    }
  }

  async function onPredictionCreate(data: Prediction): Promise<void> {
    const result = await createPrediction(data)

    if (result !== null) {
      updatePredictionsList((predictions) => [result, ...predictions])
      setCreationDialogOpen(false)
    }
  }

  async function onPredictionUpdate(
    data: Prediction | PredictionCreationBody,
  ): Promise<void> {
    if (isPrediction(data)) {
      const result = await updatePrediction(data)

      if (result !== null) {
        updatePredictionsList((predictions) => [result, ...predictions])
      }
    } else {
      const result = await createPrediction(data)

      if (result !== null) {
        updatePredictionsList((predictions) =>
          predictions.map((prediction) => {
            if (prediction.id === result.id) {
              return result
            } else {
              return prediction
            }
          }),
        )
      }
    }
  }

  async function onPredictionsUpdate(
    data: Array<Prediction | PredictionCreationBody>,
  ): Promise<void> {
    const created: Prediction[] = await (async () => {
      const newPredictions = data.filter(
        (subject) => !isPrediction(subject),
      ) as PredictionCreationBody[]

      if (newPredictions.length > 0) {
        const result = await createPredictions({
          predictions: newPredictions,
        })

        if (result !== null) {
          return result
        } else {
          return []
        }
      } else {
        return []
      }
    })()

    const updated: Prediction[] = await (async () => {
      const existingPredictions = data.filter((subject) =>
        isPrediction(subject),
      ) as Prediction[]

      if (existingPredictions.length > 0) {
        const result = await updatePredictions({
          predictions: existingPredictions,
        })

        if (result !== null) {
          return result
        } else {
          return []
        }
      } else {
        return []
      }
    })()

    updatePredictionsList((predictions) => [
      ...created,
      ...predictions.map((prediction) => {
        const match = updated.find(
          (updatedPrediction) => updatedPrediction.id === prediction.id,
        )

        if (typeof match === "undefined") {
          return prediction
        } else {
          return match
        }
      }),
    ])
  }

  async function onPredictionDelete(prediction: Prediction): Promise<void> {
    const result = await deletePrediction(prediction)

    if (result !== null) {
      updatePredictionsList((predictions) =>
        predictions.filter(
          (prediction) => prediction.categoryId !== result.categoryId,
        ),
      )
    }
  }

  const isTableLoading =
    createPredictionsResponse.isLoading() ||
    updatePredictionResponse.isLoading() ||
    updatePredictionsResponse.isLoading() ||
    deletePredictionResponse.isLoading()

  return (
    <Container>
      <Stack spacing={1.5} sx={{ mt: 1.5 }}>
        <Paper
          sx={{
            mt: 1.5,
            p: 1.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h5">Predictions</Typography>
          <Stack direction="row" spacing={1.5}>
            <Button onClick={() => setCreationDialogOpen(true)}>
              Create prediction
            </Button>
            <ValidatedSelect
              name="year"
              value={params.year.toString(10)}
              options={years}
              optionLabels={labels}
              onChange={onYearChange}
            />
          </Stack>
        </Paper>
        <Query
          response={networkResponse.merge({
            categoriesAggregation,
            predictions: predictionsList,
          })}
          render={({ categoriesAggregation, predictions }) => (
            <PredictionsTable
              year={params.year + 1}
              categoriesAggregation={categoriesAggregation}
              predictions={predictions}
              isLoading={isTableLoading}
              onPredictionUpdate={onPredictionUpdate}
              onPredictionsUpdate={onPredictionsUpdate}
              onPredictionDelete={onPredictionDelete}
            />
          )}
        />
      </Stack>
      <Dialog
        open={creationDialogIsOpen}
        onClose={() => setCreationDialogOpen(false)}
      >
        <DialogContent>
          <PredictionCreationForm
            year={params.year + 1}
            isVisible={creationDialogIsOpen}
            networkResponse={createPredictionResponse}
            onSubmit={onPredictionCreate}
            excludedCategoriesIds={predictionsList
              .map((predictions) =>
                predictions.map((prediction) => prediction.categoryId),
              )
              .getOrElse([])}
          />
        </DialogContent>
      </Dialog>
    </Container>
  )
}
