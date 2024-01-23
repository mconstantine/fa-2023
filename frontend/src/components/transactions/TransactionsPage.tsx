import {
  Button,
  Container,
  Dialog,
  DialogContent,
  Paper,
  Stack,
  Typography,
} from "@mui/material"
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
  TransactionCreationBody,
} from "./domain"
import TransactionsTable, { SelectableTransaction } from "./TransactionsTable"
import TransactionFilters from "./filters/TransactionFilters"
import { BulkUpdateTransactionsData } from "./bulkUpdate/BulkUpdateTransactionsDialog"
import TransactionForm from "./TransactionForm"

interface TransactionFormState {
  open: boolean
  subject: Transaction | null
}

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
  const [importDialogIsOpen, setImportDialogOpen] = useState(false)

  const [formState, setFormState] = useState<TransactionFormState>({
    open: false,
    subject: null,
  })

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
  >("PATCH", "/transactions/bulk/")

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
    setImportDialogOpen(false)
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

  function onEditTransactionButtonClick(transaction: Transaction): void {
    setFormState({ open: true, subject: transaction })
  }

  function onDeleteTransactionButtonClick(transaction: Transaction): void {
    console.log("TODO: delete transaction", { transaction })
  }

  function onTransactionFormSubmit(data: TransactionCreationBody): void {
    console.log("TODO: submit form", { data })
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
          <Stack direction="row" spacing={0.5}>
            <Button onClick={() => setFormState({ open: true, subject: null })}>
              Add transaction
            </Button>
            <Button onClick={() => setImportDialogOpen(true)}>
              Import transactions
            </Button>
          </Stack>
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
              onEditTransactionButtonClick={onEditTransactionButtonClick}
              onDeleteTransactionButtonClick={onDeleteTransactionButtonClick}
            />
          )}
        />
      </Stack>
      <ImportTransactionsDialog
        isOpen={importDialogIsOpen}
        onClose={() => setImportDialogOpen(false)}
        onSubmit={onImportSubmit}
      />
      <Dialog
        open={formState.open}
        onClose={() => setFormState((state) => ({ ...state, open: false }))}
      >
        <DialogContent>
          <TransactionForm
            isVisible={formState.open}
            transaction={formState.subject}
            // TODO:
            isLoading={false}
            onSubmit={onTransactionFormSubmit}
            onCancel={() =>
              setFormState((state) => ({ ...state, open: false }))
            }
          />
        </DialogContent>
      </Dialog>
    </Container>
  )
}
