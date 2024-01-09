import { Meta, StoryObj } from "@storybook/react"
import TransactionFiltersDialogContent from "../../components/transactions/filters/TransactionFiltersDialogContent"
import { useState } from "react"
import { FindTransactionsParams } from "../../components/transactions/domain"
import { useMockNetworkResponse } from "../useMockNetworkResponse"

const meta: Meta<typeof TransactionFiltersDialogContent> = {
  title: "Transactions/Filters",
  component: TransactionFiltersDialogContent,
  parameters: {},
  tags: ["autodocs"],
  argTypes: {},
}

export default meta
type Story = StoryObj<typeof TransactionFiltersDialogContent>

export const Default: Story = {
  args: {},
  render: function NonBlankInputStory() {
    const [params, setParams] = useState<FindTransactionsParams>({
      startDate: new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1))
        .toISOString()
        .slice(0, 10),
      endDate: new Date(Date.UTC(new Date().getUTCFullYear() + 1, 0, 0))
        .toISOString()
        .slice(0, 10),
    })

    const [networkResponse, triggerNetworkRequest] =
      useMockNetworkResponse<void>()

    function onChange(params: FindTransactionsParams): void {
      setParams(params)
      triggerNetworkRequest()
    }

    return (
      <TransactionFiltersDialogContent
        params={params}
        onChange={onChange}
        networkResponse={networkResponse}
      />
    )
  },
}
