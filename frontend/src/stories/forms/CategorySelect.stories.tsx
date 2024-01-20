import { Meta, StoryObj } from "@storybook/react"
import CategorySelect, {
  CategorySelection,
} from "../../components/forms/inputs/CategorySelect"
import {
  Category,
  CategoryCreationBody,
  isCategory,
} from "../../components/categories/domain"
import { v4 } from "uuid"
import { useMockNetworkResponse } from "../useMockNetworkResponse"
import { useState } from "react"
import { useDebounce } from "../../hooks/useDebounce"

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

export const Default: Story = {
  args: {},
  render: function CategorySelectStory(props) {
    const [query, setQuery] = useState("")

    const [selection, setSelection] = useState<Category[]>([])

    const [categoriesResponse, fetchCategories] =
      useMockNetworkResponse<Category[]>(categories)

    const debounceFetchCategories = useDebounce(fetchCategories, 500)

    function onQueryChange(query: string): void {
      setQuery(query)

      debounceFetchCategories(
        categories.filter((category) =>
          category.name.toLowerCase().includes(query.toLowerCase()),
        ),
      )
    }

    function onSelectionChange(selection: Category[]): void {
      setSelection(selection)
      fetchCategories(selection)
    }

    function onSubmitSingleCreatable(
      selection: Category | CategoryCreationBody,
    ): void {
      if (isCategory(selection)) {
        onSelectionChange([selection])
      } else {
        const newCategory: Category = {
          ...selection,
          id: v4(),
        }

        categories = [...categories, newCategory]
        categories.sort((a, b) => a.name.localeCompare(b.name))

        onSelectionChange([newCategory])
      }
    }

    function onSubmitMultipleCreatable(selection: CategorySelection): void {
      const newCategories: Category[] = selection.additions.map((data) => ({
        ...data,
        id: v4(),
      }))

      categories = [...categories, ...newCategories]
      categories.sort((a, b) => a.name.localeCompare(b.name))

      onSelectionChange([...selection.categories, ...newCategories])
    }

    function onSubmitSingleSelectable(selection: Category): void {
      onSelectionChange([selection])
    }

    function onSubmitMultipleSelectable(selection: Category[]): void {
      onSelectionChange(selection)
    }

    const commonProps = {
      networkResponse: categoriesResponse,
      searchQuery: query,
      onSearchQueryChange: onQueryChange,
    }

    if (props.creatable) {
      if (props.multiple) {
        return (
          <CategorySelect
            {...commonProps}
            creatable
            multiple
            selection={selection as Category[]}
            onSubmit={onSubmitMultipleCreatable}
          />
        )
      } else {
        return (
          <CategorySelect
            {...commonProps}
            creatable
            multiple={false}
            selection={selection[0] ?? (null as Category | null)}
            onSubmit={onSubmitSingleCreatable}
          />
        )
      }
    } else {
      if (props.multiple) {
        return (
          <CategorySelect
            {...commonProps}
            creatable={false}
            multiple
            selection={selection as Category[]}
            onSubmit={onSubmitMultipleSelectable}
          />
        )
      } else {
        return (
          <CategorySelect
            {...commonProps}
            creatable={false}
            multiple={false}
            selection={selection[0] ?? (null as Category | null)}
            onSubmit={onSubmitSingleSelectable}
          />
        )
      }
    }
  },
}
