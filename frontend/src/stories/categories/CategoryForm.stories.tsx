import { Meta, StoryObj } from "@storybook/react"
import CategoryForm from "../../components/categories/CategoryForm"
import { Category } from "../../components/categories/domain"

interface CategoryFormStory {
  mode: "create" | "update"
}

const meta: Meta<CategoryFormStory> = {
  title: "Categories/CategoryForm",
  // @ts-expect-error mismatching props and controls
  component: CategoryForm,
  parameters: {},
  tags: ["autodocs"],
  argTypes: {
    mode: {
      name: "Mode",
      control: { type: "select" },
      options: {
        Create: "create",
        Update: "update",
      },
      defaultValue: "Create",
    },
  },
}

export default meta
type Story = StoryObj<CategoryFormStory>

export const Default: Story = {
  args: {},
  render: function CategoryFormStory(props) {
    const category: Category | null = (() => {
      switch (props.mode) {
        case "create":
          return null
        case "update":
          return {
            id: "abcde",
            name: "Taxes",
            keywords: ["f24", "agenzia delle entrate"],
          }
      }
    })()

    return (
      <CategoryForm category={category} onSubmit={() => {}} key={props.mode} />
    )
  },
}
