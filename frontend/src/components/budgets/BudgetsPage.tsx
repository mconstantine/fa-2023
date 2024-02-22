import * as NetworkResponse from "../../network/NetworkResponse"
import * as S from "@effect/schema/Schema"
import BudgetsTable from "./BudgetsTable"
import { Container, Paper, Stack, Typography } from "@mui/material"
import { useQuery, useRequestData } from "../../hooks/network"
import {
  aggregateTransactionsByCategoryRequest,
  listBudgetsRequest,
} from "./api"
import { useMemo } from "react"
import ValidatedSelect from "../forms/inputs/ValidatedSelect"
import { Either, Option, pipe } from "effect"
import { constVoid } from "effect/Function"
import Query from "../Query"

export default function BudgetsPage() {
  const [filters, setFilters] = useRequestData<typeof listBudgetsRequest>(
    listBudgetsRequest,
    {
      query: {
        year: new Date().getFullYear(),
      },
    },
  )

  const yearBeforeFilters = useMemo(
    () => ({
      query: {
        year: filters.query.year - 1,
      },
    }),
    [filters],
  )

  // const [creationDialogIsOpen, setCreationDialogOpen] = useState(false)

  // const [categoriesAggregation] = useQuery<
  //   CategoriesAggregationParams,
  //   CategoriesAggregation[]
  // >("/transactions/categories/", params)

  const [budgets] = useQuery(listBudgetsRequest, filters)

  const [transactionsByCategory] = useQuery(
    aggregateTransactionsByCategoryRequest,
    yearBeforeFilters,
  )

  // const [createPredictionResponse, createPrediction] = useCommand<
  //   PredictionCreationBody,
  //   Prediction
  // >("POST", "/predictions/")

  // const [createPredictionsResponse, createPredictions] = useCommand<
  //   PredictionBulkCreationBody,
  //   Prediction[]
  // >("POST", "/predictions/bulk/")

  // const [updatePredictionResponse, updatePrediction] = useCommand<
  //   PredictionUpdateBody,
  //   Prediction
  // >("PATCH", "/predictions/")

  // const [updatePredictionsResponse, updatePredictions] = useCommand<
  //   PredictionBulkUpdateBody,
  //   Prediction[]
  // >("PATCH", "/predictions/bulk/")

  // const [deletePredictionResponse, deletePrediction] = useCommand<
  //   Prediction,
  //   Omit<Prediction, "id">
  // >("DELETE", "/predictions/")

  const yearOptions: Record<string, string> = useMemo(() => {
    const min = 2023
    const max = new Date().getFullYear()

    const options = new Array(max - min)
      .fill(null)
      .map((_, index) => min + index)

    const labels = options.reduce((result, year) => {
      result[(year + 1).toString(10)] = `${year.toString(10)}/${(
        year + 1
      ).toString(10)}`

      return result
    }, {} as Record<string, string>)

    return labels
  }, [])

  function onYearChange(year: string) {
    pipe(
      year,
      S.decodeOption(S.NumberFromString.pipe(S.int()).pipe(S.positive())),
      Option.match({
        onNone: constVoid,
        onSome: (n) => {
          console.log(n + 1)
          setFilters({
            query: {
              year: n,
            },
          })
        },
      }),
    )

    return Either.right(year)
  }

  // async function onPredictionCreate(data: Prediction): Promise<void> {
  //   const result = await createPrediction(data)

  //   if (result !== null) {
  //     updatePredictionsList((predictions) => [result, ...predictions])
  //     setCreationDialogOpen(false)
  //   }
  // }

  // async function onPredictionUpdate(
  //   data: Prediction | PredictionCreationBody,
  // ): Promise<void> {
  //   if (isPrediction(data)) {
  //     const result = await updatePrediction(data)

  //     if (result !== null) {
  //       updatePredictionsList((predictions) => [result, ...predictions])
  //     }
  //   } else {
  //     const result = await createPrediction(data)

  //     if (result !== null) {
  //       updatePredictionsList((predictions) =>
  //         predictions.map((prediction) => {
  //           if (prediction.id === result.id) {
  //             return result
  //           } else {
  //             return prediction
  //           }
  //         }),
  //       )
  //     }
  //   }
  // }

  // async function onPredictionsUpdate(
  //   data: Array<Prediction | PredictionCreationBody>,
  // ): Promise<void> {
  //   const created: Prediction[] = await (async () => {
  //     const newPredictions = data.filter(
  //       (subject) => !isPrediction(subject),
  //     ) as PredictionCreationBody[]

  //     if (newPredictions.length > 0) {
  //       const result = await createPredictions({
  //         predictions: newPredictions,
  //       })

  //       if (result !== null) {
  //         return result
  //       } else {
  //         return []
  //       }
  //     } else {
  //       return []
  //     }
  //   })()

  //   const updated: Prediction[] = await (async () => {
  //     const existingPredictions = data.filter((subject) =>
  //       isPrediction(subject),
  //     ) as Prediction[]

  //     if (existingPredictions.length > 0) {
  //       const result = await updatePredictions({
  //         predictions: existingPredictions,
  //       })

  //       if (result !== null) {
  //         return result
  //       } else {
  //         return []
  //       }
  //     } else {
  //       return []
  //     }
  //   })()

  //   updatePredictionsList((predictions) => [
  //     ...created,
  //     ...predictions.map((prediction) => {
  //       const match = updated.find(
  //         (updatedPrediction) => updatedPrediction.id === prediction.id,
  //       )

  //       if (typeof match === "undefined") {
  //         return prediction
  //       } else {
  //         return match
  //       }
  //     }),
  //   ])
  // }

  // async function onPredictionDelete(deleted: Prediction): Promise<void> {
  //   const result = await deletePrediction(deleted)

  //   if (result !== null) {
  //     updatePredictionsList((predictions) =>
  //       predictions.filter((prediction) => prediction.id !== deleted.id),
  //     )
  //   }
  // }

  // const isTableLoading =
  //   createPredictionsResponse.isLoading() ||
  //   updatePredictionResponse.isLoading() ||
  //   updatePredictionsResponse.isLoading() ||
  //   deletePredictionResponse.isLoading()

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
          <Typography variant="h5">Budgets</Typography>
          <Stack direction="row" spacing={1.5}>
            {/* <Button onClick={() => setCreationDialogOpen(true)}>
              Create prediction
            </Button> */}
            <ValidatedSelect
              name="year"
              value={filters.query.year.toString()}
              options={yearOptions}
              onChange={onYearChange}
              error={Option.none()}
            />
          </Stack>
        </Paper>
        <Query
          response={pipe(
            { budgets, transactionsByCategory },
            NetworkResponse.all,
          )}
          render={({ budgets, transactionsByCategory }) => (
            <BudgetsTable
              year={filters.query.year}
              budgets={budgets}
              transactionsByCategory={transactionsByCategory}
              // onPredictionUpdate={onPredictionUpdate}
              // onPredictionsUpdate={onPredictionsUpdate}
              // onPredictionDelete={onPredictionDelete}
            />
          )}
        />
      </Stack>
      {/* <Dialog
        open={creationDialogIsOpen}
        onClose={() => setCreationDialogOpen(false)}
      >
        <DialogContent>
          <PredictionCreationForm
            year={params.year + 1}
            isVisible={creationDialogIsOpen}
            networkResponse={createPredictionResponse}
            onSubmit={onPredictionCreate}
            onCancel={() => setCreationDialogOpen(false)}
            excludedCategoriesIds={predictionsList
              .map((predictions) =>
                predictions.map((prediction) => prediction.categoryId),
              )
              .getOrElse([])}
          />
        </DialogContent>
      </Dialog> */}
    </Container>
  )
}
