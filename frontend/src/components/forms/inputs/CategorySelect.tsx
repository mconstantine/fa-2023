import {
  Autocomplete,
  Chip,
  CircularProgress,
  Stack,
  SxProps,
  TextField,
  Theme,
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

interface BaseProps {
  categories: NetworkResponse<Category[]>
  searchQuery: string
  onSearchQueryChange(searchQuery: string): void
  sx?: SxProps<Theme>
}

interface SingleCreatableProps extends BaseProps {
  creatable: true
  multiple: false
  selection: Category | null
  onSelectionChange(selection: Category | CategoryCreationBody): void
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
  selection: Category[]
  onSelectionChange(selection: CategorySelection): void
}

interface MultipleSelectableProps extends BaseProps {
  creatable: false
  multiple: true
  selection: Category[]
  onSelectionChange(category: Category[]): void
}

type Props =
  | SingleCreatableProps
  | SingleSelectableProps
  | MultipleCreatableProps
  | MultipleSelectableProps

export default function CategorySelect(props: Props) {
  const isLoading = props.categories.isLoading()
  const value = props.selection

  const options: Array<Category | CategoryCreationBody> =
    props.categories.getOrElse([])

  const onQueryChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    props.onSearchQueryChange(event.currentTarget.value)
  }

  function getOptionKey(
    input: string | Category | CategoryCreationBody,
  ): string {
    if (typeof input !== "string" && isCategory(input)) {
      return input.id
    } else if (typeof input === "string") {
      return input
    } else {
      return input.name
    }
  }

  function getOptionLabel(
    input: string | Category | CategoryCreationBody,
  ): string {
    if (typeof input === "string") {
      return input
    } else if (isCategory(input)) {
      return input.name
    } else {
      return `Add "${input.name}"`
    }
  }

  function isOptionEqualToValue(
    a: Category | CategoryCreationBody,
    b: Category | CategoryCreationBody,
  ): boolean {
    const aIsCategory = isCategory(a)
    const bIsCategory = isCategory(b)

    if (aIsCategory !== bIsCategory) {
      return false
    } else if (aIsCategory && bIsCategory) {
      return a.id === b.id
    } else {
      return a.name === b.name
    }
  }

  function filterOptions(options: Category[]): Category[]
  function filterOptions(
    options: CategoryCreationBody[],
  ): CategoryCreationBody[]
  function filterOptions(
    options: Array<Category | CategoryCreationBody>,
  ): Array<Category | CategoryCreationBody> {
    if (
      props.creatable &&
      options.length === 0 &&
      props.categories.isSuccessful() &&
      props.searchQuery !== ""
    ) {
      return [
        {
          name: props.searchQuery,
          keywords: [],
          isMeta: false,
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
      | CategoryCreationBody
      | Array<string | Category | CategoryCreationBody>
      | null,
  ): void {
    if (value !== null) {
      if (props.multiple) {
        const selection = value as Array<
          string | Category | CategoryCreationBody
        >

        if (props.creatable) {
          props.onSelectionChange({
            categories: selection.filter(
              (c) => typeof c !== "string" && isCategory(c),
            ) as Category[],
            additions: selection.filter(
              (c) => typeof c !== "string" && !isCategory(c),
            ) as CategoryCreationBody[],
          })
        } else {
          props.onSelectionChange(selection as Category[])
        }
      } else if (typeof value !== "string") {
        const selection = value as Category | CategoryCreationBody

        if (props.creatable) {
          props.onSelectionChange(selection as CategoryCreationBody)
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
        value={value}
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
