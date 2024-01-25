import { Container, Paper, Stack, Typography, useTheme } from "@mui/material"
import { useState } from "react"
import ValidatedSelect from "../forms/inputs/ValidatedSelect"
import { MonthlyAggregation, MonthlyAggregationParams } from "./domain"
import { useQuery } from "../../hooks/network"
import { BarChart } from "@mui/x-charts/BarChart"
import Query from "../Query"

interface BarChartData extends Record<string, string | number> {
  month: string
  income: number
  outcome: number
  total: number
}

export default function MonthlyPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [params, setParams] = useState<MonthlyAggregationParams>({ year })

  const theme = useTheme()
  const [monthlyAggregationResponse] = useQuery<
    MonthlyAggregationParams,
    MonthlyAggregation[]
  >("/transactions/monthly", params)

  const minYear = 2023
  const maxYear = new Date().getFullYear()

  const yearOptions = new Array(maxYear - minYear + 1)
    .fill(null)
    .map((_, index) => index + minYear)
    .reduce<Record<string, string>>((result, year) => {
      result[year.toString(10)] = year.toString(10)
      return result
    }, {})

  const barChartResponse = monthlyAggregationResponse.map((data) =>
    data.map<BarChartData>((entry) => ({
      month: new Date(year, entry.month - 1, 1).toLocaleDateString(undefined, {
        month: "short",
      }),
      income: entry.income,
      outcome: entry.outcome,
      total: entry.total,
    })),
  )

  function onYearChange(yearString: string): void {
    const year = parseInt(yearString)

    if (!Number.isNaN(year)) {
      setYear(year)
      setParams({ year })
    }
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
            value={year.toString(10)}
            options={yearOptions}
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
