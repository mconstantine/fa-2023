import { Meta, StoryObj } from "@storybook/react"
import CategorySelect from "../../components/forms/inputs/CategorySelect"
import {
  Category,
  CategoryBulkCreationBody,
  CategoryCreationBody,
  FindCategoryParams,
} from "../../components/categories/domain"
import { v4 } from "uuid"
import { useMockNetworkResponse } from "../useMockNetworkResponse"
import { UseCommandOutput, UseLazyQueryOutput } from "../../hooks/network"
import { useCategorySelect } from "../../hooks/useCategorySelect"

const meta: Meta<typeof CategorySelect> = {
  title: "Forms/CategorySelect",
  component: CategorySelect,
  parameters: {},
  tags: ["autodocs"],
  argTypes: {
    creatable: {
      type: "boolean",
      control: { type: "boolean" },
    },
    multiple: {
      type: "boolean",
      control: { type: "boolean" },
    },
  },
}

export default meta
type Story = StoryObj<typeof CategorySelect>

let categories: Category[] = [
  {
    id: v4(),
    name: "Accessories",
    keywords: [],
    isMeta: false,
  },
  {
    id: v4(),
    name: "Bachelor party",
    keywords: [],
    isMeta: false,
  },
  {
    id: v4(),
    name: "Crayons",
    keywords: [],
    isMeta: false,
  },
]

function useMockLazyCategoriesQuery(): UseLazyQueryOutput<
  Category[],
  FindCategoryParams
> {
  const [response, trigger, , update] =
    useMockNetworkResponse<Category[]>(categories)

  return [
    response,
    update,
    (params) => {
      if (typeof params.query !== "undefined") {
        trigger(
          categories.filter((category) =>
            category.name.toLowerCase().includes(params.query!.toLowerCase()),
          ),
        )
      }
    },
  ]
}

function useMockCreateCategoryCommand(): UseCommandOutput<
  CategoryCreationBody,
  Category
> {
  const [response, trigger] = useMockNetworkResponse<Category>()

  return [
    response,
    (body) => {
      const category = { ...body, id: v4() }

      categories = [category, ...categories]
      categories.sort((a, b) => a.name.localeCompare(b.name))

      return trigger(category)
    },
  ]
}

function useMockBulkCreateCategoriesCommand(): UseCommandOutput<
  CategoryBulkCreationBody,
  Category[]
> {
  const [response, trigger] = useMockNetworkResponse<Category[]>()

  return [
    response,
    (body) => {
      const newCategories = body.categories.map((category) => ({
        ...category,
        id: v4(),
      }))

      categories = [...newCategories, ...categories]
      categories.sort((a, b) => a.name.localeCompare(b.name))

      return trigger(newCategories)
    },
  ]
}

export const SingleSelectable: Story = {
  args: {},
  render: function CategorySelectStory() {
    const query = useMockLazyCategoriesQuery()

    const {
      searchQuery,
      categories,
      selection,
      onSearchQueryChange,
      onSelectionChange,
    } = useCategorySelect(false, false, query)

    return (
      <CategorySelect
        creatable={false}
        multiple={false}
        networkResponse={categories}
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        selection={selection}
        onSubmit={onSelectionChange}
      />
    )
  },
}

export const MultipleSelectable: Story = {
  args: {},
  render: function CategorySelectStory() {
    const query = useMockLazyCategoriesQuery()

    const {
      searchQuery,
      categories,
      selection,
      onSearchQueryChange,
      onSelectionChange,
    } = useCategorySelect(false, true, query)

    return (
      <CategorySelect
        creatable={false}
        multiple
        networkResponse={categories}
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        selection={selection}
        onSubmit={onSelectionChange}
      />
    )
  },
}

export const SingleCreatable: Story = {
  args: {},
  render: function CategorySelectStory() {
    const query = useMockLazyCategoriesQuery()
    const createCategoryCommand = useMockCreateCategoryCommand()

    const {
      searchQuery,
      categories,
      selection,
      onSearchQueryChange,
      onSelectionChange,
    } = useCategorySelect(true, false, query, createCategoryCommand)

    return (
      <CategorySelect
        creatable
        multiple={false}
        networkResponse={categories}
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        selection={selection}
        onSubmit={onSelectionChange}
      />
    )
  },
}

export const MultipleCreatable: Story = {
  args: {},
  render: function CategorySelectStory() {
    const query = useMockLazyCategoriesQuery()
    const createCategoryCommand = useMockCreateCategoryCommand()
    const bulkCreateCategoriesCommand = useMockBulkCreateCategoriesCommand()

    const {
      searchQuery,
      categories,
      selection,
      onSearchQueryChange,
      onSelectionChange,
    } = useCategorySelect(
      true,
      true,
      query,
      createCategoryCommand,
      bulkCreateCategoriesCommand,
    )

    return (
      <CategorySelect
        creatable
        multiple
        networkResponse={categories}
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        selection={selection}
        onSubmit={onSelectionChange}
      />
    )
  },
}
