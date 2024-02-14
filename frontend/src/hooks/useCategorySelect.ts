import { useEffect, useState } from "react"
import { Category } from "../components/categories/domain"
import { NetworkResponse, networkResponse } from "../network/NetworkResponse"
import { CategorySelection } from "../components/forms/inputs/CategorySelect"
import { useDebounce } from "./useDebounce"

type Selection = Category | null | Category[]

interface BaseUseCategorySelectionInput {
  visible: boolean
  categoriesQuery: UseLazyQueryOutput<Category[], FindCategoryParams>
  excludeMeta?: boolean
}

interface SingleCreatableUseCategorySelectInput
  extends BaseUseCategorySelectionInput {
  multiple: false
  creatable: true
  initialValue: Category | null
  createCategoryCommand: UseCommandOutput<CategoryCreationBody, Category>
}

interface SingleSelectableUseCategorySelectInput
  extends BaseUseCategorySelectionInput {
  multiple: false
  creatable: false
  initialValue: Category | null
}

interface MultipleCreatableUseCategorySelectInput
  extends BaseUseCategorySelectionInput {
  multiple: true
  creatable: true
  initialValue: Category[]
  createCategoryCommand: UseCommandOutput<CategoryCreationBody, Category>
  bulkCreateCategoriesCommand: UseCommandOutput<
    CategoryBulkCreationBody,
    Category[]
  >
}

interface MultipleSelectableUseCategorySelectInput
  extends BaseUseCategorySelectionInput {
  multiple: true
  creatable: false
  initialValue: Category[]
}

type UseCategorySelectInput =
  | SingleCreatableUseCategorySelectInput
  | SingleSelectableUseCategorySelectInput
  | MultipleCreatableUseCategorySelectInput
  | MultipleSelectableUseCategorySelectInput

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

type UseCategorySelectOutput =
  | SingleCreatableUseCategorySelectOutput
  | SingleSelectableUseCategorySelectOutput
  | MultipleCreatableUseCategorySelectOutput
  | MultipleSelectableUseCategorySelectOutput

export function useCategorySelect(
  input: SingleSelectableUseCategorySelectInput,
): SingleSelectableUseCategorySelectOutput
export function useCategorySelect(
  input: SingleCreatableUseCategorySelectInput,
): SingleCreatableUseCategorySelectOutput
export function useCategorySelect(
  input: MultipleSelectableUseCategorySelectInput,
): MultipleSelectableUseCategorySelectOutput
export function useCategorySelect(
  input: MultipleCreatableUseCategorySelectInput,
): MultipleCreatableUseCategorySelectOutput
export function useCategorySelect(
  input: UseCategorySelectInput,
): UseCategorySelectOutput {
  const [searchQuery, setSearchQuery] = useState("")
  const [selection, setSelection] = useState<Selection>(input.initialValue)

  const [categoriesResponse, updateCategories, fetchCategories] =
    input.categoriesQuery

  const debounceFetchCategory = useDebounce(fetchCategories, 500)

  const createCategoryResponse = input.creatable
    ? input.createCategoryCommand[0]
    : null

  const createCategory = input.creatable ? input.createCategoryCommand[1] : null

  const bulkCreateCategoriesResponse =
    input.creatable && input.multiple
      ? input.bulkCreateCategoriesCommand[0]
      : null

  const bulkCreateCategories =
    input.creatable && input.multiple
      ? input.bulkCreateCategoriesCommand[1]
      : null

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
        if (bulkCreateCategoriesResponse === null) {
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
    debounceFetchCategory(searchQuery === "" ? {} : { query: searchQuery })
  }

  const result = {
    categories: categorySelectionResponse,
    searchQuery,
    onSearchQueryChange,
  }

  useEffect(() => {
    if (input.visible && categoriesResponse.isIdle()) {
      fetchCategories(input.excludeMeta ? { isMeta: false } : {})
    }
  }, [input.visible, categoriesResponse, fetchCategories, input.excludeMeta])

  if (!input.multiple && !input.creatable) {
    return {
      ...result,
      selection: selection as Category | null,
      onSelectionChange: setSelection,
    }
  } else if (input.multiple && !input.creatable) {
    return {
      ...result,
      selection: selection as Category[],
      onSelectionChange: setSelection,
    }
  } else if (!input.multiple && input.creatable) {
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
          if (selection.additions.length && bulkCreateCategories !== null) {
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
