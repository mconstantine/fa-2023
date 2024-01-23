import { useState } from "react"
import { UseCommandOutput, UseLazyQueryOutput } from "./network"
import {
  Category,
  CategoryBulkCreationBody,
  CategoryCreationBody,
  FindCategoryParams,
  isCategory,
} from "../components/categories/domain"
import { NetworkResponse, networkResponse } from "../network/NetworkResponse"
import { CategorySelection } from "../components/forms/inputs/CategorySelect"
import { useDebounce } from "./useDebounce"

type Selection = Category | null | Category[]

interface BaseUseCategorySelectOutput {
  categories: NetworkResponse<Category[]>
  searchQuery: string
  onSearchQueryChange(searchQuery: string): void
}

interface SingleCreatableUseCategorySelectOutput
  extends BaseUseCategorySelectOutput {
  selection: Category | null
  onSelectionChange(selection: Category | CategoryCreationBody): void
}

interface SingleSelectableUseCategorySelectOutput
  extends BaseUseCategorySelectOutput {
  selection: Category | null
  onSelectionChange(category: Category): void
}

interface MultipleCreatableUseCategorySelectOutput
  extends BaseUseCategorySelectOutput {
  selection: Category[]
  onSelectionChange(selection: CategorySelection): void
}

interface MultipleSelectableUseCategorySelectOutput
  extends BaseUseCategorySelectOutput {
  selection: Category[]
  onSelectionChange(category: Category[]): void
}

export function useCategorySelect(
  creatable: false,
  multiple: false,
  categoriesQuery: UseLazyQueryOutput<Category[], FindCategoryParams>,
): SingleSelectableUseCategorySelectOutput
export function useCategorySelect(
  creatable: true,
  multiple: false,
  categoriesQuery: UseLazyQueryOutput<Category[], FindCategoryParams>,
  createCategoryCommand: UseCommandOutput<CategoryCreationBody, Category>,
): SingleCreatableUseCategorySelectOutput
export function useCategorySelect(
  creatable: false,
  multiple: true,
  categoriesQuery: UseLazyQueryOutput<Category[], FindCategoryParams>,
): MultipleSelectableUseCategorySelectOutput
export function useCategorySelect(
  creatable: true,
  multiple: true,
  categoriesQuery: UseLazyQueryOutput<Category[], FindCategoryParams>,
  createCategoryCommand: UseCommandOutput<CategoryCreationBody, Category>,
  bulkCreateCategoriesCommand: UseCommandOutput<
    CategoryBulkCreationBody,
    Category[]
  >,
): MultipleCreatableUseCategorySelectOutput
export function useCategorySelect(
  creatable: boolean,
  multiple: boolean,
  categoriesQuery: UseLazyQueryOutput<Category[], FindCategoryParams>,
  createCategoryCommand?: UseCommandOutput<CategoryCreationBody, Category>,
  bulkCreateCategoriesCommand?: UseCommandOutput<
    CategoryBulkCreationBody,
    Category[]
  >,
):
  | SingleSelectableUseCategorySelectOutput
  | SingleCreatableUseCategorySelectOutput
  | MultipleSelectableUseCategorySelectOutput
  | MultipleCreatableUseCategorySelectOutput {
  const [searchQuery, setSearchQuery] = useState("")

  const [selection, setSelection] = useState<Selection>(() => {
    if (multiple) {
      return []
    } else {
      return null
    }
  })

  const [categoriesResponse, updateCategories, fetchCategories] =
    categoriesQuery

  const debounceFetchCategory = useDebounce(fetchCategories, 500)
  const createCategoryResponse = createCategoryCommand?.[0]
  const createCategory = createCategoryCommand?.[1]
  const bulkCreateCategoriesResponse = bulkCreateCategoriesCommand?.[0]
  const bulkCreateCategories = bulkCreateCategoriesCommand?.[1]

  const categorySelectionResponse =
    createCategoryResponse
      ?.match<NetworkResponse<Category[]>>({
        whenIdle: () => categoriesResponse,
        whenSuccessful: () => categoriesResponse,
        whenFailed: (response) =>
          networkResponse.fromFailure<Category[]>(
            response.status,
            response.message,
          ),
        whenLoading: () => networkResponse.make<Category[]>().load(),
      })
      .flatMap<Category[]>(() => {
        if (typeof bulkCreateCategoriesResponse === "undefined") {
          return categoriesResponse
        } else {
          return bulkCreateCategoriesResponse.match<
            NetworkResponse<Category[]>
          >({
            whenIdle: () => categoriesResponse,
            whenSuccessful: () => categoriesResponse,
            whenFailed: (response) =>
              networkResponse.fromFailure<Category[]>(
                response.status,
                response.message,
              ),
            whenLoading: () => networkResponse.make<Category[]>().load(),
          })
        }
      }) ?? categoriesResponse

  function onSearchQueryChange(searchQuery: string): void {
    setSearchQuery(searchQuery)
    debounceFetchCategory({ query: searchQuery })
  }

  const result = {
    categories: categorySelectionResponse,
    searchQuery,
    onSearchQueryChange,
  }

  if (!multiple && !creatable) {
    return {
      ...result,
      selection: selection as Category | null,
      onSelectionChange: setSelection,
    }
  } else if (multiple && !creatable) {
    return {
      ...result,
      selection: selection as Category[],
      onSelectionChange: setSelection,
    }
  } else if (!multiple && creatable) {
    return {
      ...result,
      selection: selection as Category | null,
      onSelectionChange: (selection: Category | CategoryCreationBody) => {
        if (isCategory(selection)) {
          setSelection(selection)
        } else {
          createCategory?.(selection).then((category) => {
            if (category !== null) {
              updateCategories((categories) => [category, ...categories])
              setSelection(category)
            }
          })
        }
      },
    }
  } else {
    return {
      ...result,
      selection: selection as Category[],
      onSelectionChange: async (
        selection: CategorySelection,
      ): Promise<void> => {
        const creationResult = await (async () => {
          if (
            selection.additions.length &&
            typeof bulkCreateCategories !== "undefined"
          ) {
            return await bulkCreateCategories({
              categories: selection.additions,
            })
          } else {
            return []
          }
        })()

        if (creationResult !== null) {
          updateCategories((categories) => [...creationResult, ...categories])
          setSelection([...creationResult, ...selection.categories])
        }
      },
    }
  }
}
