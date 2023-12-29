import { Meta, StoryObj } from "@storybook/react"
import CategoriesList from "../../components/categories/CategoriesList"
import { useMockNetworkResponse } from "../useMockNetworkResponse"
import { Category } from "../../components/categories/domain"
import { v4 } from "uuid"

interface CategoriesStoryListArgs {
  shouldFail: boolean
}

const meta: Meta<CategoriesStoryListArgs> = {
  title: "Categories/CategoriesList",
  // @ts-expect-error mismatching props and controls
  component: CategoriesList,
  parameters: {},
  tags: ["autodocs"],
  argTypes: {
    shouldFail: {
      type: "boolean",
      defaultValue: false,
      control: "boolean",
    },
  },
}

export default meta
type Story = StoryObj<CategoriesStoryListArgs>

export const Default: Story = {
  args: {},
  render: function CategoriesStory(props) {
    const [readingResponse, , , updateCategories] = useMockNetworkResponse<
      Category[]
    >([
      {
        id: v4(),
        name: "Miscellanea",
        keywords: [],
      },
      {
        id: v4(),
        name: "Taxes",
        keywords: ["f24", "agenzia delle entrate"],
      },
      {
        id: v4(),
        name: "Groceries",
        keywords: ["esselunga", "amazon it"],
      },
    ])

    const [creationResponse, triggerCreation, failCreation] =
      useMockNetworkResponse<Category>()

    const [updateResponse, triggerUpdate, failUpdate] =
      useMockNetworkResponse<Category>()

    const [deletionResponse, triggerDeletion, failDeletion] =
      useMockNetworkResponse<Category>()

    async function onCategoryCreate(category: Category): Promise<boolean> {
      if (props.shouldFail) {
        await failCreation(500, "Error!")
      } else {
        await triggerCreation({
          ...category,
          id: v4(),
        })

        updateCategories((categories) => [category, ...categories])
      }

      return !props.shouldFail
    }

    async function onCategoryUpdate(update: Category): Promise<boolean> {
      if (props.shouldFail) {
        await failUpdate(500, "Error!")
      } else {
        await triggerUpdate(update)

        updateCategories((categories) =>
          categories.map((category) => {
            if (category.id === update.id) {
              return update
            } else {
              return category
            }
          }),
        )
      }

      return !props.shouldFail
    }

    async function onCategoryDelete(deleted: Category): Promise<boolean> {
      if (props.shouldFail) {
        await failDeletion(500, "Error!")
      } else {
        await triggerDeletion(deleted)

        updateCategories((categories) =>
          categories.filter((category) => category.id !== deleted.id),
        )
      }

      return !props.shouldFail
    }

    return (
      <CategoriesList
        readingResponse={readingResponse}
        creationResponse={creationResponse}
        updateResponse={updateResponse}
        deletionResponse={deletionResponse}
        onCategoryCreate={onCategoryCreate}
        onCategoryUpdate={onCategoryUpdate}
        onCategoryDelete={onCategoryDelete}
      />
    )
  },
}
