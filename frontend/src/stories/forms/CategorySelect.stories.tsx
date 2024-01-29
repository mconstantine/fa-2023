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
    const categoriesQuery = useMockLazyCategoriesQuery()

    const {
      searchQuery,
      categories,
      selection,
      onSearchQueryChange,
      onSelectionChange,
    } = useCategorySelect({
      visible: true,
      multiple: false,
      creatable: false,
      initialValue: null,
      categoriesQuery,
    })

    return (
      <CategorySelect
        creatable={false}
        multiple={false}
        categories={categories}
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        selection={selection}
        onSelectionChange={onSelectionChange}
      />
    )
  },
}

export const MultipleSelectable: Story = {
  args: {},
  render: function CategorySelectStory() {
    const categoriesQuery = useMockLazyCategoriesQuery()

    const {
      searchQuery,
      categories,
      selection,
      onSearchQueryChange,
      onSelectionChange,
    } = useCategorySelect({
      visible: true,
      multiple: true,
      creatable: false,
      initialValue: [],
      categoriesQuery,
    })

    return (
      <CategorySelect
        creatable={false}
        multiple
        categories={categories}
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        selection={selection}
        onSelectionChange={onSelectionChange}
      />
    )
  },
}

export const SingleCreatable: Story = {
  args: {},
  render: function CategorySelectStory() {
    const categoriesQuery = useMockLazyCategoriesQuery()
    const createCategoryCommand = useMockCreateCategoryCommand()

    const {
      searchQuery,
      categories,
      selection,
      onSearchQueryChange,
      onSelectionChange,
    } = useCategorySelect({
      visible: true,
      multiple: false,
      creatable: true,
      initialValue: null,
      categoriesQuery,
      createCategoryCommand,
    })

    return (
      <CategorySelect
        creatable
        multiple={false}
        categories={categories}
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        selection={selection}
        onSelectionChange={onSelectionChange}
      />
    )
  },
}

export const MultipleCreatable: Story = {
  args: {},
  render: function CategorySelectStory() {
    const categoriesQuery = useMockLazyCategoriesQuery()
    const createCategoryCommand = useMockCreateCategoryCommand()
    const bulkCreateCategoriesCommand = useMockBulkCreateCategoriesCommand()

    const {
      searchQuery,
      categories,
      selection,
      onSearchQueryChange,
      onSelectionChange,
    } = useCategorySelect({
      visible: true,
      multiple: true,
      creatable: true,
      initialValue: [],
      categoriesQuery,
      createCategoryCommand,
      bulkCreateCategoriesCommand,
    })

    return (
      <CategorySelect
        creatable
        multiple
        categories={categories}
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        selection={selection}
        onSelectionChange={onSelectionChange}
      />
    )
  },
}
