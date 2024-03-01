import * as S from "@effect/schema/Schema"
import { constVoid } from "effect/Function"
import { Container, Paper, Stack, Toolbar, Typography } from "@mui/material"
import { Either, pipe } from "effect"
import { useLazyQuery, useQuery, useRequestData } from "../../hooks/network"
import { aggregateTransactionsByTimeAndCategoryRequest } from "./api"
import Query from "../Query"
import TimeData from "./TimeData"
import { useForm } from "../../hooks/useForm"
import ValidatedSelect from "../forms/inputs/ValidatedSelect"
import { AggregateTransactionsByTimeAndCategoryInput } from "./domain"
import { listCategoriesRequest } from "../categories/api"
import { useState } from "react"
import { useDebounce } from "../../hooks/useDebounce"
import { Category } from "../categories/domain"
import CategorySelect from "../forms/inputs/CategorySelect"
import CategoriesData from "./CategoriesData"

export default function CategoryTimePage() {
  const [filters, setFilters] = useRequestData<
    typeof aggregateTransactionsByTimeAndCategoryRequest
  >(aggregateTransactionsByTimeAndCategoryRequest, {
    query: {
      time_range: "monthly",
      year: new Date().getUTCFullYear(),
      categories_ids: [],
    },
  })

  const [categories, fetchCategories] = useLazyQuery(listCategoriesRequest)
  const [categoriesQuery, setCategoriesQuery] = useState("")
  const debounceFetchCategories = useDebounce(fetchCategories, 500)

  const [aggregation] = useQuery(
    aggregateTransactionsByTimeAndCategoryRequest,
    filters,
  )

  const { inputProps } = useForm({
    initialValues: {
      ...filters.query,
      categories: [],
    },
    validators: {
      year: S.NumberFromString.pipe(S.int()).pipe(S.positive()),
      categories: S.array(Category),
    },
    submit: constVoid,
  })

  const yearOptions = (() => {
    const minYear = 2023
    const maxYear = new Date().getUTCFullYear()

    return new Array(maxYear - minYear + 1)
      .fill(null)
      .map((_, index) => index + minYear)
      .reduce<Record<string, string>>((result, year) => {
        result[year.toString(10)] = year.toString(10)
        return result
      }, {})
  })()

  const timeRangeLabels: Record<
    AggregateTransactionsByTimeAndCategoryInput["time_range"],
    string
  > = {
    monthly: "Month",
    weekly: "Week",
    daily: "Day",
  }

  function onYearChange(yearString: string): Either.Either<string, string> {
    const validation = inputProps("year").onChange(yearString)

    pipe(
      validation,
      Either.match({
        onLeft: constVoid,
        onRight: (year) => {
          setFilters((filters) => ({ query: { ...filters.query, year } }))
        },
      }),
    )

    return Either.right(yearString)
  }

  function onTimeRangeChange(
    timeRange: AggregateTransactionsByTimeAndCategoryInput["time_range"],
  ): Either.Either<
    string,
    AggregateTransactionsByTimeAndCategoryInput["time_range"]
  > {
    const validation = inputProps("time_range").onChange(timeRange)

    pipe(
      validation,
      Either.match({
        onLeft: constVoid,
        onRight: (timeRange) => {
          setFilters((filters) => ({
            query: { ...filters.query, time_range: timeRange },
          }))
        },
      }),
    )

    return validation
  }

  function onCategoriesQueryChange(query: string): void {
    setCategoriesQuery(query)

    debounceFetchCategories({
      query: {
        direction: "forward",
        count: 10,
        ...(query === "" ? {} : { search_query: query }),
        is_meta: false,
      },
    })
  }

  function onCategoriesChange(categories: Category[]) {
    inputProps("categories").onChange(categories)

    setFilters((filters) => ({
      query: {
        ...filters.query,
        categories_ids: categories.map((category) => category.id),
      },
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
              label="Year"
              options={yearOptions}
              {...inputProps("year")}
              onChange={onYearChange}
              sx={{ minWidth: "6em" }}
            />
            <ValidatedSelect
              label="Time Range"
              options={timeRangeLabels}
              {...inputProps("time_range")}
              onChange={onTimeRangeChange}
              sx={{ minWidth: "6em" }}
            />
            <CategorySelect
              creatable={false}
              multiple
              categories={categories}
              searchQuery={categoriesQuery}
              selection={inputProps("categories").value}
              onSearchQueryChange={onCategoriesQueryChange}
              onSelectionChange={onCategoriesChange}
              sx={{ width: "100%", minWidth: "8em" }}
            />
          </Stack>
        </Toolbar>
        <Paper sx={{ p: 1.5 }}>
          <Query
            response={aggregation}
            render={(data) => (
              <Stack spacing={3}>
                <TimeData
                  year={filters.query.year}
                  timeRange={filters.query.time_range}
                  data={data.time}
                />
                <CategoriesData
                  data={data.categories}
                  selection={inputProps("categories").value}
                />
              </Stack>
            )}
          />
        </Paper>
      </Stack>
    </Container>
  )
}
