import { Meta, StoryObj } from "@storybook/react"
import CategoryCard from "../../components/categories/CategoryCard"

const meta: Meta<typeof CategoryCard> = {
  title: "Categories/CategoryCard",
  component: CategoryCard,
  parameters: {},
  tags: ["autodocs"],
  argTypes: {},
}

export default meta
type Story = StoryObj<typeof CategoryCard>

export const Default: Story = {
  args: {},
  render: function CategoriesStory() {
    return (
      <CategoryCard
        category={{
          id: "efgh",
          name: "Taxes",
          keywords: ["f24", "agenzia delle entrate"],
        }}
        onEditButtonClick={() => {}}
        onDeleteButtonClick={() => {}}
      />
    )
  },
}
