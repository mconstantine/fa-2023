import { Button, Container, Paper, Stack, Typography } from "@mui/material"
import { useState } from "react"
import ImportTransactionsDialog from "./ImportTransactionsDialog"
import { useCommand, useQuery } from "../../hooks/network"
import Query from "../Query"
import { PaginatedResponse, PaginationParams } from "../../globalDomain"
import {
  BulkUpdateTransactionsBody,
  CategoryMode,
  FindTransactionsBy,
  FindTransactionsParams,
  Transaction,
} from "./domain"
import TransactionsTable, { SelectableTransaction } from "./TransactionsTable"
import TransactionFilters from "./filters/TransactionFilters"
import { BulkUpdateTransactionsData } from "./bulkUpdate/BulkUpdateTransactionsDialog"

function transactionsQueryTransformer(
  response: PaginatedResponse<Transaction>,
): PaginatedResponse<SelectableTransaction> {
  const [transactions, count] = response

  return [
    transactions.map((t) => {
      t["isSelected"] = false
      return t as SelectableTransaction
    }),
    count,
  ]
}

export default function TransactionsPage() {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)

  const [params, setParams] = useState<FindTransactionsParams>({
    findBy: FindTransactionsBy.DESCRIPTION,
    page: 0,
    perPage: 100,
    startDate: new Date(
      Date.UTC(new Date().getFullYear() - 1, 0, 1),
    ).toISOString(),
    endDate: new Date(Date.UTC(new Date().getFullYear(), 0, 1)).toISOString(),
    categoryMode: CategoryMode.ALL,
  })

  const [paginatedTransactions, updateTransactions, fetchTransactions] =
    useQuery<
      FindTransactionsParams,
      PaginatedResponse<Transaction>,
      PaginatedResponse<SelectableTransaction>
    >("/transactions", params, transactionsQueryTransformer)

  const [bulkUpdateNetworkResponse, bulkUpdate] = useCommand<
    BulkUpdateTransactionsBody,
    Transaction[]
  >("PATCH", "/transactions/")

  const selectedCount = paginatedTransactions
    .map(([transactions]) =>
      transactions.reduce((sum, t) => {
        if (t.isSelected) {
          return sum + 1
        } else {
          return sum
        }
      }, 0),
    )
    .getOrElse(0)

  function onImportSubmit(): void {
    setIsImportDialogOpen(false)
    fetchTransactions()
  }

  function onTransactionsSelectionChange(
    selected: boolean,
    ids: string[],
  ): void {
    updateTransactions(([transactions, count]) => {
      return [
        transactions.map((transaction) => {
          if (ids.includes(transaction.id)) {
            transaction.isSelected = selected
          }

          return transaction
        }),
        count,
      ]
    })
  }

  function onPaginationParamsChange(paginationParams: PaginationParams) {
    setParams((params) => ({ ...params, ...paginationParams }))
  }

  async function onBulkUpdate(
    data: BulkUpdateTransactionsData,
  ): Promise<boolean> {
    const ids: string[] = paginatedTransactions
      .map(([transactions]) =>
        transactions.filter((t) => t.isSelected).map((t) => t.id),
      )
      .getOrElse([])

    const response = await bulkUpdate({ ids, ...data })

    if (response === null) {
      return false
    } else {
      updateTransactions(([transactions, count]) => [
        transactions.map((transaction) => {
          const updated = response.find((t) => t.id === transaction.id)

          if (typeof updated === "undefined") {
            return transaction
          } else {
            return { ...updated, isSelected: true }
          }
        }),
        count,
      ])

      return true
    }
  }

  return (
    <Container>
      <Stack spacing={1.5} sx={{ mt: 1.5 }}>
        <Paper
          sx={{
            mt: 1.5,
            p: 1.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h5">Transactions</Typography>
          <Button onClick={() => setIsImportDialogOpen(true)}>
            Import transactions
          </Button>
        </Paper>
        <TransactionFilters
          findTransactionsNetworkResponse={paginatedTransactions}
          updateTransactionsNetworkResponse={bulkUpdateNetworkResponse}
          params={params}
          onParamsChange={setParams}
          selectedCount={selectedCount}
          onBulkUpdate={onBulkUpdate}
        />
        <Query
          response={paginatedTransactions}
          render={([transactions, count]) => (
            <TransactionsTable
              transactions={transactions}
              transactionsCount={count}
              onTransactionsSelectionChange={onTransactionsSelectionChange}
              params={params}
              onParamsChange={onPaginationParamsChange}
            />
          )}
        />
      </Stack>
      <ImportTransactionsDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onSubmit={onImportSubmit}
      />
    </Container>
  )
}
