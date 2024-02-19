import {
  Backdrop,
  Button,
  Container,
  FormControl,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Paper,
  Stack,
  Typography,
} from "@mui/material"
import CategoryCard from "./CategoryCard"
import { Category, ListCategoriesInput } from "./domain"
import * as NetworkResponse from "../../network/NetworkResponse"
import Query from "../Query"
import { PaginationResponse } from "../../globalDomain"
import { useState } from "react"
import CategoryForm from "./CategoryForm"
import { useConfirmation } from "../../hooks/useConfirmation"
import { Search } from "@mui/icons-material"
import { useDebounce } from "../../hooks/useDebounce"
import { usePagination } from "../../hooks/usePagination"
import Pagination from "../Pagination"
import { HttpError } from "../../hooks/network"
import { pipe } from "effect"

interface ListingMode {
  type: "listing"
}

interface InsertingMode {
  type: "inserting"
}

interface UpdatingMode {
  type: "updating"
  category: Category
}

type Mode = ListingMode | InsertingMode | UpdatingMode

interface Props {
  filters: ListCategoriesInput
  categories: NetworkResponse.NetworkResponse<
    HttpError,
    PaginationResponse<Category>
  >
  insertionResponse: NetworkResponse.NetworkResponse<HttpError, Category>
  updateResponse: NetworkResponse.NetworkResponse<HttpError, Category>
  deletionResponse: NetworkResponse.NetworkResponse<
    HttpError,
    Omit<Category, "id">
  >
  onFiltersChange(filters: ListCategoriesInput): void
  onCategoryInsert(category: Category): Promise<boolean>
  onCategoryUpdate(category: Category): Promise<boolean>
  onCategoryDelete(category: Category): Promise<boolean>
}

export default function CategoriesList(props: Props) {
  const [mode, setMode] = useState<Mode>({ type: "listing" })

  const [searchQuery, setSearchQuery] = useState(
    props.filters.search_query ?? "",
  )

  const [onDeleteCategoryButtonClick, deleteConfirmationDialog] =
    useConfirmation(props.onCategoryDelete, (category) => ({
      title: "Warning! One way decision",
      message: `Are you sure you want delete category "${category.name}"? The category will be lost forever!`,
    }))

  const isBackdropOpen: boolean = (() => {
    switch (mode.type) {
      case "listing":
        return false
      case "inserting":
      case "updating":
        return true
    }
  })()

  const debounceUpdateFiltersQuery = useDebounce((searchQuery: string) => {
    props.onFiltersChange({
      direction: props.filters.direction,
      count: props.filters.count,
      ...(searchQuery === "" ? {} : { search_query: searchQuery }),
    })
  }, 500)

  function onChangeFiltersQuery(searchQuery: string) {
    setSearchQuery(searchQuery)
    debounceUpdateFiltersQuery(searchQuery)
  }

  function onInsertCategoryButtonClick() {
    setMode({ type: "inserting" })
  }

  function onEditCategoryButtonClick(category: Category): void {
    setMode({ type: "updating", category })
  }

  function cancel() {
    setMode({ type: "listing" })
  }

  function onSubmit(category: Category): void {
    switch (mode.type) {
      case "inserting":
        props.onCategoryInsert(category).then((result) => {
          if (result) {
            setMode({ type: "listing" })
          }
        })
        return
      case "updating":
        props.onCategoryUpdate(category).then((result) => {
          if (result) {
            setMode({ type: "listing" })
          }
        })
        return
      case "listing":
        return
    }
  }

  return (
    <>
      <Container>
        <Stack spacing={1.5} sx={{ mt: 1.5, mb: 1.5 }}>
          <Paper
            sx={{
              mt: 1.5,
              p: 1.5,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h5">Categories</Typography>
            <Button onClick={onInsertCategoryButtonClick}>Add category</Button>
          </Paper>
          <FormControl variant="outlined" fullWidth>
            <InputLabel htmlFor="search">Search</InputLabel>
            <OutlinedInput
              id="search"
              endAdornment={
                <InputAdornment position="end">
                  <Search />
                </InputAdornment>
              }
              label="Search"
              value={searchQuery}
              onChange={(event) =>
                onChangeFiltersQuery(event.currentTarget.value)
              }
            />
          </FormControl>
          <Query
            response={pipe(
              props.deletionResponse,
              NetworkResponse.andThen(() => props.categories),
            )}
            render={(categories) => (
              <List
                categories={categories}
                filters={props.filters}
                onFiltersChange={props.onFiltersChange}
                onEditCategoryButtonClick={onEditCategoryButtonClick}
                onDeleteCategoryButtonClick={onDeleteCategoryButtonClick}
              />
            )}
          />
        </Stack>
        <Backdrop open={isBackdropOpen}>
          <Paper sx={{ pt: 3, pb: 3, pl: 1.5, pr: 1.5 }}>
            <CategoryForm
              key={mode.type}
              category={(() => {
                switch (mode.type) {
                  case "listing":
                  case "inserting":
                    return null
                  case "updating":
                    return mode.category
                }
              })()}
              onSubmit={onSubmit}
              networkResponse={(() => {
                switch (mode.type) {
                  case "inserting":
                    return props.insertionResponse
                  case "updating":
                    return props.updateResponse
                  case "listing":
                    return NetworkResponse.idle()
                }
              })()}
              cancelAction={cancel}
            />
          </Paper>
        </Backdrop>
      </Container>
      {deleteConfirmationDialog}
    </>
  )
}

interface ListProps {
  categories: PaginationResponse<Category>
  filters: ListCategoriesInput
  onFiltersChange(filters: ListCategoriesInput): void
  onEditCategoryButtonClick(category: Category): void
  onDeleteCategoryButtonClick(category: Category): void
}

function List(props: ListProps) {
  const paginationProps = usePagination({
    filters: props.filters,
    paginationResponse: props.categories,
    rowsPerPageOptions: [20, 50, 100],
    onFiltersChange: props.onFiltersChange,
  })

  return (
    <Stack spacing={3}>
      <Pagination {...paginationProps} />
      <Stack spacing={1.5}>
        {props.categories.edges.map((category) => (
          <CategoryCard
            key={category.cursor}
            category={category.node}
            onEditButtonClick={() =>
              props.onEditCategoryButtonClick(category.node)
            }
            onDeleteButtonClick={() =>
              props.onDeleteCategoryButtonClick(category.node)
            }
          />
        ))}
      </Stack>
      <Pagination {...paginationProps} />
    </Stack>
  )
}
