import { useMemo, useState } from "react"
import { useQuery } from "../../hooks/network"
import {
  CategoriesAggregation,
  CategoriesAggregationParams,
  Prediction,
} from "./domain"
import { Container, Paper, Stack, Typography } from "@mui/material"
import Query from "../Query"
import PredictionsTable from "./PredictionsTable"
import ValidatedSelect from "../forms/inputs/ValidatedSelect"
import { networkResponse } from "../../network/NetworkResponse"

export default function PredictionsPage() {
  const [params, setParams] = useState<CategoriesAggregationParams>({
    year: new Date().getFullYear() - 1,
  })

  const [categoriesAggregation] = useQuery<
    CategoriesAggregationParams,
    CategoriesAggregation[]
  >("/transactions/categories/", params)

  const [predictions, updatePredictions] = useQuery<Prediction[]>(
    `/predictions/${(params.year + 1).toString(10)}`,
  )

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

  function onPredictionsCreate(newPredictions: Prediction[]): void {
    updatePredictions((predictions) => [...predictions, ...newPredictions])
  }

  function onPredictionsUpdate(updatedPredictons: Prediction[]): void {
    updatePredictions((predictions) =>
      predictions.map((prediction) => {
        const match = updatedPredictons.find(
          (updatedPrediction) => updatedPrediction.id === prediction.id,
        )

        if (typeof match === "undefined") {
          return prediction
        } else {
          return match
        }
      }),
    )
  }

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
          <ValidatedSelect
            name="year"
            value={params.year.toString(10)}
            options={years}
            optionLabels={labels}
            onChange={onYearChange}
          />
        </Paper>
        <Query
          response={networkResponse.merge({
            categoriesAggregation,
            predictions,
          })}
          render={({ categoriesAggregation, predictions }) => (
            <PredictionsTable
              year={params.year + 1}
              categoriesAggregation={categoriesAggregation}
              predictions={predictions}
              onPredictionsCreate={onPredictionsCreate}
              onPredictionsUpdate={onPredictionsUpdate}
            />
          )}
        />
      </Stack>
    </Container>
  )
}
