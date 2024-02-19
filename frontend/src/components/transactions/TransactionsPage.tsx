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
import { useCommand, useQuery, useRequestData } from "../../hooks/network"
import Query from "../Query"
import { PaginationResponse as PaginationResponseType } from "../../globalDomain"
import TransactionsTable from "./TransactionsTable"
import TransactionFilters from "./filters/TransactionFilters"
import {
  deleteTransactionRequest,
  insertTransactionRequest,
  listTransactionsRequest,
  updateTransactionRequest,
  updateTransactionsRequest,
} from "./api"
import { Either, Option, pipe } from "effect"
import { constFalse, constVoid } from "effect/Function"
import { PaginationResponse } from "../../network/PaginationResponse"
import {
  ListTransactionsInput,
  TransactionWithCategories,
  UpdateTransactionsInput,
} from "./domain"
import TransactionForm from "./TransactionForm"
import { InsertTransactionInput } from "../../../../backend/src/database/functions/transaction/domain"

interface TransactionFormState {
  open: boolean
  subject: Option.Option<TransactionWithCategories>
}

export default function TransactionsPage() {
  // const [importDialogIsOpen, setImportDialogOpen] = useState(false)

  const [formState, setFormState] = useState<TransactionFormState>({
    open: false,
    subject: Option.none(),
  })

  const [filters, setFilters] = useRequestData<typeof listTransactionsRequest>({
    query: {
      direction: "forward",
      count: 100,
      subject: "description",
      search_query: "",
      categories: "all",
      date_since: new Date(Date.UTC(new Date().getFullYear() - 1, 0, 1)),
      date_until: new Date(Date.UTC(new Date().getFullYear(), 0, 0)),
    },
  })

  const [transactions, updateTransactions] = useQuery(
    listTransactionsRequest,
    filters,
  )

  const [newTransaction, insertTransaction] = useCommand(
    insertTransactionRequest,
  )

  const [updatedTransaction, updateTransaction] = useCommand(
    updateTransactionRequest,
  )

  const [deletedTransaction, deleteTransaction] = useCommand(
    deleteTransactionRequest,
  )

  function onFiltersChange(filters: ListTransactionsInput): void {
    setFilters({ query: filters })
  }

  function onEditTransactionButtonClick(
    transaction: TransactionWithCategories,
  ): void {
    setFormState({ open: true, subject: Option.some(transaction) })
  }

  async function onDeleteTransactionButtonClick(
    transaction: TransactionWithCategories,
  ): Promise<void> {
    const result = await deleteTransaction({
      params: { id: transaction.id },
    })

    pipe(
      result,
      Either.match({
        onLeft: constVoid,
        onRight: (deletedTransaction) =>
          updateTransactions(
            (transactions) =>
              PaginationResponse.of(transactions).remove(deletedTransaction)
                .response,
          ),
      }),
    )
  }

  async function onTransactionFormSubmit(
    body: InsertTransactionInput,
  ): Promise<void> {
    const result = await pipe(
      formState.subject,
      Option.match({
        onNone: () => insertTransaction({ body }),
        onSome: (subject) =>
          updateTransaction({
            params: { id: subject.id },
            body,
          }),
      }),
    )

    pipe(
      result,
      Either.match({
        onLeft: constVoid,
        onRight: (result) => {
          pipe(
            formState.subject,
            Option.match({
              onNone: () =>
                updateTransactions(
                  (transactions) =>
                    PaginationResponse.of(transactions).prepend(result)
                      .response,
                ),
              onSome: () =>
                updateTransactions(
                  (transactions) =>
                    PaginationResponse.of(transactions).replace(result)
                      .response,
                ),
            }),
            () => {
              setFormState((state) => ({ ...state, open: false }))
            },
          )
        },
      }),
    )
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
            <Button
              onClick={() =>
                setFormState({ open: true, subject: Option.none() })
              }
            >
              Add transaction
            </Button>
            {/* <Button onClick={() => setImportDialogOpen(true)}>
              Import transactions
            </Button> */}
          </Stack>
        </Paper>
        <Query
          response={newTransaction
            .andThen(() => updatedTransaction)
            .andThen(() => deletedTransaction)
            .andThen(() => transactions)}
          render={(transactions) => (
            <SelectableTransactionsPage
              transactions={transactions}
              filters={filters.query}
              onFiltersChange={onFiltersChange}
              onEditTransactionButtonClick={onEditTransactionButtonClick}
              onDeleteTransactionButtonClick={onDeleteTransactionButtonClick}
            />
          )}
        />
      </Stack>
      <Dialog
        open={formState.open}
        onClose={() => setFormState((state) => ({ ...state, open: false }))}
      >
        <DialogContent>
          <TransactionForm
            isVisible={formState.open}
            transaction={formState.subject}
            networkResponse={
              formState.subject === null ? newTransaction : updatedTransaction
            }
            onSubmit={onTransactionFormSubmit}
            onCancel={() =>
              setFormState((state) => ({ ...state, open: false }))
            }
          />
        </DialogContent>
      </Dialog>
      {/* <ImportTransactionsDialog
        isOpen={importDialogIsOpen}
        onClose={() => setImportDialogOpen(false)}
        onSubmit={onImportSubmit}
      />
      */}
    </Container>
  )
}

export interface SelectableTransaction extends TransactionWithCategories {
  isSelected: boolean
}

interface SelectableTransactionsPageProps {
  transactions: PaginationResponseType<TransactionWithCategories>
  filters: ListTransactionsInput
  onFiltersChange(filters: ListTransactionsInput): void
  onEditTransactionButtonClick(transaction: TransactionWithCategories): void
  onDeleteTransactionButtonClick(transaction: TransactionWithCategories): void
}

function SelectableTransactionsPage(props: SelectableTransactionsPageProps) {
  const [selectableTransactions, setSelectableTransactions] = useState<
    PaginationResponseType<SelectableTransaction>
  >(
    PaginationResponse.of(props.transactions).mapNodes((transaction) => ({
      ...transaction,
      isSelected: false,
    })).response,
  )

  const [updatedTransactions, bulkUpdateTransactions] = useCommand(
    updateTransactionsRequest,
  )

  function onTransactionSelectionChange(id: string): void {
    setSelectableTransactions(
      (transactions) =>
        PaginationResponse.of(transactions).mapNodes((transaction) => {
          if (transaction.id === id) {
            return { ...transaction, isSelected: !transaction.isSelected }
          } else {
            return transaction
          }
        }).response,
    )
  }

  function onAllTransactionsSelectionChange(selection: boolean) {
    setSelectableTransactions(
      (transactions) =>
        PaginationResponse.of(transactions).mapNodes((transaction) => ({
          ...transaction,
          isSelected: selection,
        })).response,
    )
  }

  async function onTransactionsUpdate(
    data: Omit<UpdateTransactionsInput, "ids">,
  ): Promise<boolean> {
    const ids: string[] = selectableTransactions.edges
      .filter((edge) => edge.node.isSelected)
      .map((edge) => edge.node.id)

    const response = await bulkUpdateTransactions({ body: { ids, ...data } })

    return pipe(
      response,
      Either.match({
        onLeft: constFalse,
        onRight: (updatedTransactions) => {
          setSelectableTransactions(
            (transactions) =>
              PaginationResponse.of(transactions).replace(
                updatedTransactions.map((transaction) => ({
                  ...transaction,
                  isSelected: true,
                })),
              ).response,
          )

          return true
        },
      }),
    )
  }

  return (
    <Stack spacing={1.5}>
      <TransactionFilters
        selectableTransactions={selectableTransactions}
        updateNetworkResponse={updatedTransactions}
        filters={props.filters}
        onFiltersChange={props.onFiltersChange}
        onUpdate={onTransactionsUpdate}
      />
      <TransactionsTable
        selectableTransactions={selectableTransactions}
        filters={props.filters}
        onFiltersChange={props.onFiltersChange}
        onTransactionSelectionChange={onTransactionSelectionChange}
        onAllTransactionsSelectionChange={onAllTransactionsSelectionChange}
        onEditTransactionButtonClick={props.onEditTransactionButtonClick}
        onDeleteTransactionButtonClick={props.onDeleteTransactionButtonClick}
      />
    </Stack>
  )
}
