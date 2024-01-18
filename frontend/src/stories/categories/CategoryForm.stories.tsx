import { Meta, StoryObj } from "@storybook/react"
import CategoryForm from "../../components/categories/CategoryForm"
import { Category } from "../../components/categories/domain"
import { useMockNetworkResponse } from "../useMockNetworkResponse"
import { NetworkResponse } from "../../network/NetworkResponse"

interface CategoryFormStory {
  mode: "create" | "update"
  shouldFail: boolean
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
      options: ["create", "update"],
      defaultValue: "create",
    },
    shouldFail: {
      type: "boolean",
      defaultValue: false,
      control: "boolean",
    },
  },
}

export default meta
type Story = StoryObj<CategoryFormStory>

export const Default: Story = {
  args: {},
  render: function CategoryFormStory(props) {
    const [mockNetworkResponse, update, fail] =
      useMockNetworkResponse<Category | null>(() => {
        switch (props.mode) {
          // Storybook control defaultValue may not work and set undefined
          case "create":
          default:
            return null
          case "update":
            return {
              id: "abcde",
              name: "Taxes",
              keywords: ["f24", "agenzia delle entrate"],
              isMeta: false,
            }
        }
      })

    function onSubmit(data: Category) {
      if (props.shouldFail) {
        fail(500, "Error!")
      } else {
        update(data)
      }
    }

    return (
      <CategoryForm
        category={mockNetworkResponse.getOrElse(null)}
        onSubmit={onSubmit}
        key={props.mode}
        networkResponse={mockNetworkResponse as NetworkResponse<Category>}
      />
    )
  },
}
