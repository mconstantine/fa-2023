import { Button, Container, Paper, Stack, Typography } from "@mui/material"
import { useState } from "react"
import ImportTransactionsDialog from "./ImportTransactionsDialog"
import { useCommand, useQuery } from "../../hooks/network"
import Query from "../Query"
import { PaginatedResponse } from "../../globalDomain"
import {
  BulkUpdateTransactionsBody,
  FindTransactionsParams,
  Transaction,
} from "./domain"
import TransactionsList, { SelectableTransaction } from "./TransactionsList"
import TransactionFilters from "./filters/TransactionFilters"
import { BulkUpdateTransactionsData } from "./filters/BulkUpdateTransactionsForm"

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
  const [isImportDialogOpen, setIsImportDialodOpen] = useState(false)

  const [params, setParams] = useState<FindTransactionsParams>({
    startDate: new Date(
      Date.UTC(new Date().getFullYear() - 1, 0, 1),
    ).toISOString(),
    endDate: new Date(Date.UTC(new Date().getFullYear(), 0, 1)).toISOString(),
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

  const transactionsCount = paginatedTransactions
    .map(([transactions]) => transactions.length)
    .getOrElse(0)

  function onImportSubmit(): void {
    setIsImportDialodOpen(false)
    fetchTransactions()
  }

  function onParamsChange(params: FindTransactionsParams): void {
    setParams(params)
  }

  function setAllIsSelected(allIsSelected: boolean): void {
    if (allIsSelected) {
      updateTransactions(([transactions, count]) => {
        return [
          transactions.map((t) => {
            t.isSelected = true
            return t
          }),
          count,
        ]
      })
    } else {
      updateTransactions(([transactions, count]) => {
        return [
          transactions.map((t) => {
            t.isSelected = false
            return t
          }),
          count,
        ]
      })
    }
  }

  function onTransactionSelectionChange(
    transaction: SelectableTransaction,
  ): void {
    updateTransactions(([transactions, count]) => {
      return [
        transactions.map((t) => {
          if (t.id === transaction.id) {
            return transaction
          } else {
            return t
          }
        }),
        count,
      ]
    })
  }

  function onBulkUpdate(data: BulkUpdateTransactionsData): Promise<boolean> {
    const ids: string[] = paginatedTransactions
      .map(([transactions]) =>
        transactions.filter((t) => t.isSelected).map((t) => t.id),
      )
      .getOrElse([])

    return bulkUpdate({ ids, ...data }).then((response) => {
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
    })
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
          <Button onClick={() => setIsImportDialodOpen(true)}>
            Import transactions
          </Button>
        </Paper>
        <TransactionFilters
          findTransactionsNetworkResponse={paginatedTransactions}
          updateTransactionsNetworkResponse={bulkUpdateNetworkResponse}
          params={params}
          onParamsChange={onParamsChange}
          selectedCount={selectedCount}
          allIsSelected={selectedCount === transactionsCount}
          onSelectAllChange={setAllIsSelected}
          onBulkUpdate={onBulkUpdate}
        />
        <Query
          response={paginatedTransactions}
          render={([transactions]) => (
            <TransactionsList
              transactions={transactions}
              onTransactionSelectionChange={onTransactionSelectionChange}
            />
          )}
        />
      </Stack>
      <ImportTransactionsDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialodOpen(false)}
        onSubmit={onImportSubmit}
      />
    </Container>
  )
}
