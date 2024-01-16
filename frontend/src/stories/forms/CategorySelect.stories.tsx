import { Meta, StoryObj } from "@storybook/react"
import CategorySelect, {
  CategorySelection,
} from "../../components/forms/inputs/CategorySelect"
import { Category } from "../../components/categories/domain"
import { v4 } from "uuid"
import { useMockNetworkResponse } from "../useMockNetworkResponse"
import { useState } from "react"
import { useDebounce } from "../../hooks/useDebounce"

const meta: Meta<typeof CategorySelect> = {
  title: "Forms/CategorySelect",
  component: CategorySelect,
  parameters: {},
  tags: ["autodocs"],
  argTypes: {},
}

export default meta
type Story = StoryObj<typeof CategorySelect>

let categories: Category[] = [
  {
    id: v4(),
    name: "Accessories",
    keywords: [],
  },
  {
    id: v4(),
    name: "Bachelor party",
    keywords: [],
  },
  {
    id: v4(),
    name: "Crayons",
    keywords: [],
  },
]

export const Default: Story = {
  args: {},
  render: function CategorySelectStory() {
    const [query, setQuery] = useState("")

    const [selection, setSelection] = useState<Category[]>(
      categories.slice(0, 1),
    )

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

    function onSubmit(selection: CategorySelection): void {
      const newCategories: Category[] = selection.additions.map((data) => ({
        ...data,
        id: v4(),
      }))

      categories = [...categories, ...newCategories]
      categories.sort((a, b) => a.name.localeCompare(b.name))

      setSelection([...selection.categories, ...newCategories])
    }

    return (
      <CategorySelect
        creatable
        networkResponse={categoriesResponse}
        searchQuery={query}
        onSearchQueryChange={onQueryChange}
        selection={selection}
        onSubmit={onSubmit}
      />
    )
  },
}
