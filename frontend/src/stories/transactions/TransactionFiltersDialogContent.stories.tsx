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
    const [params, setParams] = useState<FindTransactionsParams>(() => {
      const now = new Date()

      return {
        startDate: new Date(
          Date.UTC(
            now.getUTCFullYear() - 1,
            now.getUTCMonth(),
            now.getUTCDate(),
          ),
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
      }
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
