import * as NetworkResponse from "../../network/NetworkResponse"
import * as S from "@effect/schema/Schema"
import { Container, Paper, Stack, Typography, useTheme } from "@mui/material"
import ValidatedSelect from "../forms/inputs/ValidatedSelect"
import { useQuery, useRequestData } from "../../hooks/network"
import { BarChart } from "@mui/x-charts/BarChart"
import Query from "../Query"
import { aggregateTransactionsByMonthRequest } from "./api"
import { Either, Option, pipe } from "effect"
import { constVoid } from "effect/Function"

export default function MonthlyPage() {
  const [filters, setFilters] = useRequestData<
    typeof aggregateTransactionsByMonthRequest
  >(aggregateTransactionsByMonthRequest, {
    query: {
      year: new Date().getUTCFullYear(),
    },
  })

  const theme = useTheme()

  const [entries] = useQuery(aggregateTransactionsByMonthRequest, filters)

  const minYear = 2023
  const maxYear = new Date().getFullYear()

  const yearOptions = new Array(maxYear - minYear + 1)
    .fill(null)
    .map((_, index) => index + minYear)
    .reduce<Record<string, string>>((result, year) => {
      result[year.toString(10)] = year.toString(10)
      return result
    }, {})

  const barChartResponse = pipe(
    entries,
    NetworkResponse.map((data) => {
      return new Array(12).fill(null).map((_, index) => {
        const month = new Date(filters.query.year, index, 1).toLocaleDateString(
          undefined,
          {
            month: "short",
          },
        )

        const entry = data.find((entry) => entry.month === index + 1)

        if (typeof entry === "undefined") {
          return { month, income: 0, outcome: 0, total: 0 }
        } else {
          return { ...entry, month }
        }
      })
    }),
  )

  function onYearChange(yearString: string): Either.Either<string, string> {
    pipe(
      yearString,
      S.decodeOption(S.NumberFromString),
      Option.match({
        onNone: constVoid,
        onSome: (year) => setFilters({ query: { year } }),
      }),
    )

    return Either.right(yearString)
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
          <Typography variant="h5">Monthly aggregation</Typography>
          <ValidatedSelect
            name="year"
            label="Year"
            value={filters.query.year.toString(10)}
            options={yearOptions}
            error={Option.none()}
            onChange={onYearChange}
          />
        </Paper>
        <Paper sx={{ p: 1.5 }}>
          <Query
            response={barChartResponse}
            render={(data) => {
              if (data.length > 0) {
                return (
                  <BarChart
                    dataset={data}
                    xAxis={[{ scaleType: "band", dataKey: "month" }]}
                    yAxis={[
                      {
                        valueFormatter: (n: number) => {
                          if (n >= 0) {
                            return `€${n}`
                          } else {
                            return `-€${Math.abs(n)}`
                          }
                        },
                      },
                    ]}
                    series={[
                      {
                        dataKey: "income",
                        valueFormatter: (n: number) => n.toFixed(2),
                        label: "Income",
                        color: theme.palette.success.main,
                      },
                      {
                        dataKey: "outcome",
                        valueFormatter: (n: number) => n.toFixed(2),
                        label: "Outcome",
                        color: theme.palette.error.main,
                      },
                      {
                        dataKey: "total",
                        valueFormatter: (n: number) => n.toFixed(2),
                        label: "Total",
                        color: theme.palette.primary.main,
                      },
                    ]}
                    height={600}
                  />
                )
              } else {
                return <Typography>No data for this year!</Typography>
              }
            }}
          />
        </Paper>
      </Stack>
    </Container>
  )
}
