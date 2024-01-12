import {
  Autocomplete,
  Chip,
  CircularProgress,
  Stack,
  TextField,
} from "@mui/material"
import { NetworkResponse } from "../../../network/NetworkResponse"
import {
  Category,
  CategoryCreationBody,
  isCategory,
} from "../../categories/domain"
import { ChangeEventHandler, SyntheticEvent } from "react"

export interface CategorySelection {
  categories: Category[]
  additions: CategoryCreationBody[]
}

interface Props {
  networkResponse: NetworkResponse<Category[]>
  searchQuery: string
  selection: Category[]
  onSearchQueryChange(searchQuery: string): void
  onSubmit(selection: CategorySelection): void
}

export default function CategorySelect(props: Props) {
  const isLoading = props.networkResponse.isLoading()

  const onQueryChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    props.onSearchQueryChange(event.currentTarget.value)
  }

  function onSelectionChange(
    _: SyntheticEvent<Element, Event>,
    selection: Array<string | Category | CategoryCreationBody>,
  ): void {
    props.onSubmit({
      categories: selection.filter(
        (c) => typeof c !== "string" && isCategory(c),
      ) as Category[],
      additions: selection.filter(
        (c) => typeof c !== "string" && !isCategory(c),
      ) as CategoryCreationBody[],
    })
  }

  return (
    <Stack>
      <Autocomplete
        multiple
        selectOnFocus
        clearOnBlur
        handleHomeEndKeys
        freeSolo
        value={props.selection}
        noOptionsText="Type to search categories"
        options={props.networkResponse
          .map((categories) =>
            categories.filter(
              (category) =>
                !props.selection
                  .map((category) => category.id)
                  .includes(category.id),
            ),
          )
          .getOrElse<Array<Category | CategoryCreationBody>>([])}
        getOptionKey={(input) => {
          if (typeof input !== "string" && isCategory(input)) {
            return input.id
          } else if (typeof input === "string") {
            return input
          } else {
            return input.name
          }
        }}
        getOptionLabel={(input) => {
          if (typeof input === "string") {
            return input
          } else if (isCategory(input)) {
            return input.name
          } else {
            return `Add "${input.name}"`
          }
        }}
        isOptionEqualToValue={(a, b) => a.name === b.name}
        filterOptions={(options) => {
          if (
            options.length === 0 &&
            props.networkResponse.isSuccessful() &&
            props.searchQuery !== ""
          ) {
            return [
              {
                name: props.searchQuery,
                keywords: [],
              },
            ]
          } else {
            return options
          }
        }}
        loading={isLoading}
        onChange={onSelectionChange}
        renderInput={(params) => (
          <TextField
            {...params}
            value={props.searchQuery}
            onChange={onQueryChange}
            size="medium"
            label="Categories"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {isLoading ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
            InputLabelProps={{}}
          />
        )}
        renderTags={(selection, getTagProps) => (
          <Stack direction="row" spacing={1}>
            {selection.map((category, index) => (
              <Chip
                {...getTagProps({ index })}
                variant="outlined"
                label={category.name}
              />
            ))}
          </Stack>
        )}
      />
    </Stack>
  )
}
