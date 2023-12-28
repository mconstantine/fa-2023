import { Meta, StoryObj } from "@storybook/react"
import CategoriesList from "../../components/categories/CategoriesList"

const meta: Meta<typeof CategoriesList> = {
  title: "Categories/CategoriesList",
  component: CategoriesList,
  parameters: {},
  tags: ["autodocs"],
  argTypes: {},
}

export default meta
type Story = StoryObj<typeof CategoriesList>

export const Default: Story = {
  args: {},
  render: function CategoriesStory() {
    return (
      <CategoriesList
        categories={[
          {
            id: "abcd",
            name: "Miscellanea",
            keywords: [],
          },
          {
            id: "efgh",
            name: "Taxes",
            keywords: ["f24", "agenzia delle entrate"],
          },
          {
            id: "ijkl",
            name: "Groceries",
            keywords: ["esselunga", "amazon it"],
          },
        ]}
        onEditButtonClick={() => {}}
      />
    )
  },
}
