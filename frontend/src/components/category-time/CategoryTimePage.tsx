import { useState } from "react"
import { useLazyQuery, useQuery } from "../../hooks/network"
import {
  CategoriesAndTimeAggregation,
  CategoriesAndTimeAggregationParams,
  TimeRange,
} from "./domain"
import Query from "../Query"
import {
  Container,
  Paper,
  Stack,
  Toolbar,
  Typography,
  useTheme,
} from "@mui/material"
import ValidatedSelect from "../forms/inputs/ValidatedSelect"
import { useCategorySelect } from "../../hooks/useCategorySelect"
import { Category, FindCategoryParams } from "../categories/domain"
import CategorySelect from "../forms/inputs/CategorySelect"
import { BarChart } from "@mui/x-charts"

export default function CategoryTimePage() {
  const theme = useTheme()

  const [params, setParams] = useState<CategoriesAndTimeAggregationParams>({
    year: new Date().getFullYear(),
    timeRange: TimeRange.MONTH,
    categoryIds: [],
  })

  const [categoriesTimeAggregationResponse] = useQuery<
    CategoriesAndTimeAggregationParams,
    CategoriesAndTimeAggregation[]
  >("/transactions/category-time", params)

  const categoriesQuery = useLazyQuery<Category[], FindCategoryParams>(
    "/categories",
  )

  const {
    categories,
    searchQuery,
    selection,
    onSearchQueryChange,
    onSelectionChange,
  } = useCategorySelect(true, false, true, [], categoriesQuery)

  const minYear = 2023
  const maxYear = new Date().getFullYear()

  const yearOptions = new Array(maxYear - minYear + 1)
    .fill(null)
    .map((_, index) => index + minYear)
    .reduce<Record<string, string>>((result, year) => {
      result[year.toString(10)] = year.toString(10)
      return result
    }, {})

  const timeRangeLabels = {
    WEEK: "Week",
    MONTH: "Month",
  }

  const filledTimeRangeResponse = categoriesTimeAggregationResponse.map<
    CategoriesAndTimeAggregation[]
  >((data) => {
    if (data.length === 0) {
      return []
    } else {
      const timeMin = 1

      const timeMax: number = (() => {
        switch (params.timeRange) {
          case TimeRange.MONTH:
            return 12
          case TimeRange.WEEK:
            return 51
        }
      })()

      const dataMin = Math.min(...data.map((entry) => entry.time))
      const dataMax = Math.max(...data.map((entry) => entry.time))
      const min = Math.min(timeMin, dataMin)
      const max = Math.max(timeMax, dataMax)

      return new Array(max - min + 1).fill(null).map((_, index) => {
        const entry = data.find((entry) => entry.time === index + 1)

        if (typeof entry === "undefined") {
          return {
            time: index + 1,
            total: 0,
          }
        } else {
          return entry
        }
      })
    }
  })

  function onYearChange(yearString: string): void {
    const year = parseInt(yearString)

    if (!Number.isNaN(year)) {
      setParams((params) => ({
        ...params,
        year,
      }))
    }
  }

  function onTimeRangeChange(timeRange: TimeRange): void {
    setParams((params) => ({ ...params, timeRange }))
  }

  function onCategorySelectionChange(selection: Category[]) {
    onSelectionChange(selection)
    setParams((params) => ({
      ...params,
      categoryIds: selection.map((category) => category.id),
    }))
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
          <Typography variant="h5">Categories/Time aggregation</Typography>
        </Paper>
        <Toolbar sx={{ pt: 1.5, pb: 1.5 }}>
          <Stack direction="row" spacing={1.5}>
            <ValidatedSelect
              name="year"
              label="Year"
              value={params.year.toString(10)}
              options={yearOptions}
              onChange={onYearChange}
              sx={{ minWidth: "6em" }}
            />
            <ValidatedSelect
              name="timeRange"
              label="Time Range"
              value={params.timeRange}
              options={TimeRange}
              onChange={onTimeRangeChange}
              optionLabels={timeRangeLabels}
              sx={{ minWidth: "6em" }}
            />
            <CategorySelect
              creatable={false}
              multiple
              categories={categories}
              searchQuery={searchQuery}
              selection={selection}
              onSearchQueryChange={onSearchQueryChange}
              onSelectionChange={onCategorySelectionChange}
              sx={{ width: "100%", minWidth: "8em" }}
            />
          </Stack>
        </Toolbar>
        <Paper sx={{ p: 1.5 }}>
          <Query
            response={filledTimeRangeResponse}
            render={(data) => {
              if (data.length > 0) {
                return (
                  <BarChart
                    dataset={data}
                    xAxis={[
                      {
                        scaleType: "band",
                        dataKey: "time",
                        label: timeRangeLabels[params.timeRange],
                        valueFormatter: (n: number) => {
                          switch (params.timeRange) {
                            case TimeRange.MONTH:
                              return new Date(
                                params.year,
                                n - 1,
                                1,
                              ).toLocaleString(undefined, { month: "short" })
                            case TimeRange.WEEK:
                              return `Week ${n}`
                          }
                        },
                      },
                    ]}
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
                        dataKey: "total",
                        valueFormatter: (n: number) => n.toFixed(2),
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
