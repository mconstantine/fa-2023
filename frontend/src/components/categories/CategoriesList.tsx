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
import { NetworkResponse, networkResponse } from "../../network/NetworkResponse"
import Query from "../Query"
import { PaginationResponse } from "../../globalDomain"
import { useState } from "react"
import CategoryForm from "./CategoryForm"
import { useConfirmation } from "../../hooks/useConfirmation"
import { Search } from "@mui/icons-material"
import { useDebounce } from "../../hooks/useDebounce"

// TODO: figure out pagination

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
  categories: NetworkResponse<PaginationResponse<Category>>
  insertionResponse: NetworkResponse<Category>
  updateResponse: NetworkResponse<Category>
  deletionResponse: NetworkResponse<Omit<Category, "id">>
  onChangeFilters(filters: ListCategoriesInput): void
  onInsertCategory(category: Category): Promise<boolean>
  onUpdateCategory(category: Category): Promise<boolean>
  onDeleteCategory(category: Category): Promise<boolean>
}

export default function CategoriesList(props: Props) {
  const [mode, setMode] = useState<Mode>({ type: "listing" })

  const [searchQuery, setSearchQuery] = useState(
    props.filters.search_query ?? "",
  )

  const [onDeleteCategoryButtonClick, deleteConfirmationDialog] =
    useConfirmation(props.onDeleteCategory, (category) => ({
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
    props.onChangeFilters({
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
        props.onInsertCategory(category).then((result) => {
          if (result) {
            setMode({ type: "listing" })
          }
        })
        return
      case "updating":
        props.onUpdateCategory(category).then((result) => {
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
            response={props.categories}
            render={(categories) => (
              <Stack spacing={3}>
                <Stack spacing={1.5}>
                  {categories.edges.map((category) => (
                    <CategoryCard
                      key={category.cursor}
                      category={category.node}
                      onEditButtonClick={() =>
                        onEditCategoryButtonClick(category.node)
                      }
                      onDeleteButtonClick={() =>
                        onDeleteCategoryButtonClick(category.node)
                      }
                    />
                  ))}
                </Stack>
              </Stack>
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
                    return networkResponse.make()
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
