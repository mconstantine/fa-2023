import { useMemo, useState } from "react"
import { useLazyQuery, useQuery } from "../../hooks/network"
import {
  CategoriesAndTimeAggregation,
  CategoriesAndTimeAggregationParams,
  TimeRange,
} from "./domain"
import Query from "../Query"
import { Container, Paper, Stack, Toolbar, Typography } from "@mui/material"
import ValidatedSelect from "../forms/inputs/ValidatedSelect"
import { useCategorySelect } from "../../hooks/useCategorySelect"
import { Category, FindCategoryParams } from "../categories/domain"
import CategorySelect from "../forms/inputs/CategorySelect"
import TimeData from "./TimeData"
import CategoriesData from "./CategoriesData"

export default function CategoryTimePage() {
  const [params, setParams] = useState<CategoriesAndTimeAggregationParams>({
    year: new Date().getFullYear(),
    timeRange: TimeRange.MONTH,
    categoryIds: [],
  })

  const [categoriesTimeAggregationResponse] = useQuery<
    CategoriesAndTimeAggregationParams,
    CategoriesAndTimeAggregation
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
  } = useCategorySelect({
    visible: true,
    creatable: false,
    multiple: true,
    initialValue: [],
    categoriesQuery,
  })

  const yearOptions = useMemo(() => {
    const minYear = 2023
    const maxYear = new Date().getFullYear()

    return new Array(maxYear - minYear + 1)
      .fill(null)
      .map((_, index) => index + minYear)
      .reduce<Record<string, string>>((result, year) => {
        result[year.toString(10)] = year.toString(10)
        return result
      }, {})
  }, [])

  const timeRangeLabels = {
    WEEK: "Week",
    MONTH: "Month",
    DAY: "Day",
  }

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
            response={categoriesTimeAggregationResponse}
            render={(data) => (
              <Stack spacing={3}>
                <TimeData
                  year={params.year}
                  timeRange={params.timeRange}
                  data={data.time}
                />
                <CategoriesData data={data.categories} selection={selection} />
              </Stack>
            )}
          />
        </Paper>
      </Stack>
    </Container>
  )
}
