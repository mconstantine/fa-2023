import {
  Autocomplete,
  Chip,
  CircularProgress,
  Stack,
  SxProps,
  TextField,
  Theme,
} from "@mui/material"
import * as NetworkResponse from "../../../network/NetworkResponse"
import { Category, InsertCategoryInput } from "../../categories/domain"
import { ChangeEventHandler, SyntheticEvent } from "react"
import {
  PaginationResponse,
  emptyPaginationResponse,
} from "../../../globalDomain"
import { HttpError } from "../../../hooks/network"
import { pipe } from "effect"
import * as paginationResponse from "../../../network/PaginationResponse"

export type CategorySelection = Category | InsertCategoryInput

export interface MultipleCategoriesSelection {
  categories: readonly Category[]
  additions: readonly InsertCategoryInput[]
}

interface BaseProps {
  categories: NetworkResponse.NetworkResponse<
    HttpError,
    PaginationResponse<Category>
  >
  searchQuery: string
  onSearchQueryChange(searchQuery: string): void
  sx?: SxProps<Theme>
}

interface SingleCreatableProps extends BaseProps {
  creatable: true
  multiple: false
  selection: Category | null
  onSelectionChange(selection: CategorySelection): void
}

interface SingleSelectableProps extends BaseProps {
  creatable: false
  multiple: false
  selection: Category | null
  onSelectionChange(category: Category): void
}

interface MultipleCreatableProps extends BaseProps {
  creatable: true
  multiple: true
  selection: readonly Category[]
  onSelectionChange(selection: MultipleCategoriesSelection): void
}

interface MultipleSelectableProps extends BaseProps {
  creatable: false
  multiple: true
  selection: readonly Category[]
  onSelectionChange(category: readonly Category[]): void
}

type Props =
  | SingleCreatableProps
  | SingleSelectableProps
  | MultipleCreatableProps
  | MultipleSelectableProps

export default function CategorySelect(props: Props) {
  const isLoading = NetworkResponse.isLoading(props.categories)
  const value = props.selection

  const options: Array<Category | InsertCategoryInput> = pipe(
    props.categories,
    NetworkResponse.getOrElse(() => emptyPaginationResponse<Category>()),
    paginationResponse.getNodes,
  )

  const onQueryChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    props.onSearchQueryChange(event.currentTarget.value)
  }

  function getOptionKey(
    input: string | Category | InsertCategoryInput,
  ): string {
    if (typeof input !== "string" && "id" in input) {
      return input.id
    } else if (typeof input === "string") {
      return input
    } else {
      return input.name
    }
  }

  function getOptionLabel(
    input: string | Category | InsertCategoryInput,
  ): string {
    if (typeof input === "string") {
      return input
    } else if ("id" in input) {
      return input.name
    } else {
      return `Add "${input.name}"`
    }
  }

  function isOptionEqualToValue(
    a: Category | InsertCategoryInput,
    b: Category | InsertCategoryInput,
  ): boolean {
    const aIsCategory = "id" in a
    const bIsCategory = "id" in b

    if (aIsCategory !== bIsCategory) {
      return false
    } else if (aIsCategory && bIsCategory) {
      return a.id === b.id
    } else {
      return a.name === b.name
    }
  }

  function filterOptions(options: Category[]): Category[]
  function filterOptions(options: InsertCategoryInput[]): InsertCategoryInput[]
  function filterOptions(
    options: Array<Category | InsertCategoryInput>,
  ): Array<Category | InsertCategoryInput> {
    if (
      props.creatable &&
      options.length === 0 &&
      NetworkResponse.isSuccessful(props.categories) &&
      props.searchQuery !== ""
    ) {
      return [
        {
          name: props.searchQuery,
          keywords: [],
          is_meta: false,
        },
      ]
    } else {
      return options
    }
  }

  function onSelectionChange(
    _: SyntheticEvent<Element, Event>,
    value:
      | string
      | Category
      | InsertCategoryInput
      | Array<string | Category | InsertCategoryInput>
      | null,
  ): void {
    if (value !== null) {
      if (props.multiple) {
        const selection = value as Array<
          string | Category | InsertCategoryInput
        >

        if (props.creatable) {
          props.onSelectionChange({
            categories: selection.filter(
              (c) => typeof c !== "string" && "id" in c,
            ) as Category[],
            additions: selection.filter(
              (c) => typeof c !== "string" && !("id" in c),
            ) as InsertCategoryInput[],
          })
        } else {
          props.onSelectionChange(selection as Category[])
        }
      } else if (typeof value !== "string") {
        const selection = value as Category | InsertCategoryInput

        if (props.creatable) {
          props.onSelectionChange(selection as InsertCategoryInput)
        } else {
          props.onSelectionChange(selection as Category)
        }
      }
    }
  }

  return (
    <Stack {...(props.sx ? { sx: props.sx } : {})}>
      <Autocomplete
        multiple={props.multiple}
        selectOnFocus
        clearOnBlur
        handleHomeEndKeys
        freeSolo={props.creatable}
        // Overriding the readonly attribute here, unsafe but functional for now
        value={value as Category | Category[] | null}
        noOptionsText={
          props.creatable ? "Type to search categories" : "No categories found"
        }
        options={options}
        getOptionKey={getOptionKey}
        getOptionLabel={getOptionLabel}
        isOptionEqualToValue={isOptionEqualToValue}
        filterOptions={filterOptions}
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
