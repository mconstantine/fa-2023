import { Meta, StoryObj } from "@storybook/react"
import TransactionFiltersDialogContent from "../../components/transactions/filters/TransactionFiltersDialogContent"
import { useState } from "react"
import {
  CategoryMode,
  FindTransactionsParams,
  Transaction,
} from "../../components/transactions/domain"
import { useMockNetworkResponse } from "../useMockNetworkResponse"
import { PaginatedResponse } from "../../globalDomain"
import { v4 } from "uuid"
import { Category } from "../../components/categories/domain"

const meta: Meta<typeof TransactionFiltersDialogContent> = {
  title: "Transactions/Filters",
  component: TransactionFiltersDialogContent,
  parameters: {},
  tags: ["autodocs"],
  argTypes: {},
}

export default meta
type Story = StoryObj<typeof TransactionFiltersDialogContent>

const categories: Category[] = [
  {
    id: v4(),
    name: "Some category",
    keywords: [],
  },
  {
    id: v4(),
    name: "Some other category",
    keywords: [],
  },
  {
    id: v4(),
    name: "Yet another category",
    keywords: [],
  },
]

export const Default: Story = {
  args: {},
  render: function NonBlankInputStory() {
    const [categoriesSearchQuery, setCategoriesSearchQuery] = useState("")

    const [params, setParams] =
      useState<FindTransactionsParams>(getInitialParams)

    const [transactionsNetworkResponse, triggerTransactionsNetworkRequest] =
      useMockNetworkResponse<PaginatedResponse<Transaction>>([[], 0])

    const [categoriesResponse, triggerCategoriesNetworkRequest] =
      useMockNetworkResponse<Category[]>(categories)

    function onFiltersChange(params: FindTransactionsParams): void {
      setParams(params)
      triggerTransactionsNetworkRequest([[], 0])
    }

    function onCategoriesSearchQueryChange(query: string): void {
      setCategoriesSearchQuery(query)

      triggerCategoriesNetworkRequest(
        categories.filter((category) =>
          category.name.toLowerCase().includes(query.toLowerCase()),
        ),
      )
    }

    return (
      <TransactionFiltersDialogContent
        params={params}
        onFiltersChange={onFiltersChange}
        transactionsNetworkResponse={transactionsNetworkResponse}
        categoriesNetworkResponse={categoriesResponse}
        categoriesSearchQuery={categoriesSearchQuery}
        onCategoriesSearchQueryChange={onCategoriesSearchQueryChange}
        onCancel={() => {}}
      />
    )
  },
}

function getInitialParams(): FindTransactionsParams {
  const now = new Date()

  return {
    startDate: new Date(
      Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate()),
    )
      .toISOString()
      .slice(0, 10),
    endDate: new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
      ),
    )
      .toISOString()
      .slice(0, 10),
    categoryMode: CategoryMode.ALL,
  }
}
