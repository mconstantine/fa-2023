import {
  Button,
  Container,
  Dialog,
  DialogContent,
  Paper,
  Stack,
  Typography,
} from "@mui/material"
import { useEffect, useState } from "react"
import {
  HttpError,
  useCommand,
  useFormDataCommand,
  useQuery,
  useRequestData,
} from "../../hooks/network"
import Query from "../Query"
import { PaginationResponse } from "../../globalDomain"
import TransactionsTable from "./TransactionsTable"
import TransactionFilters from "./filters/TransactionFilters"
import {
  deleteTransactionRequest,
  insertTransactionRequest,
  listTransactionsRequest,
  updateTransactionRequest,
  updateTransactionsRequest,
  uploadTransactionsRequest,
} from "./api"
import { Either, Option, pipe } from "effect"
import { constVoid } from "effect/Function"
import * as paginationResponse from "../../network/PaginationResponse"
import {
  ListTransactionsInput,
  TransactionWithCategories,
  UpdateTransactionsInput,
  UploadTransactionsInput,
} from "./domain"
import TransactionForm from "./TransactionForm"
import { InsertTransactionInput } from "../../../../backend/src/database/functions/transaction/domain"
import * as NetworkResponse from "../../network/NetworkResponse"
import ImportTransactionsDialog from "./ImportTransactionsDialog"

interface TransactionFormState {
  open: boolean
  subject: Option.Option<TransactionWithCategories>
}

export default function TransactionsPage() {
  const [importDialogIsOpen, setImportDialogOpen] = useState(false)

  const [formState, setFormState] = useState<TransactionFormState>({
    open: false,
    subject: Option.none(),
  })

  const [filters, setFilters] = useRequestData<typeof listTransactionsRequest>(
    listTransactionsRequest,
    {
      query: {
        direction: "forward",
        count: 100,
        subject: "description",
        search_query: "",
        categories: "all",
        date_since: new Date(Date.UTC(new Date().getFullYear(), 0, 1)),
        date_until: new Date(Date.UTC(new Date().getFullYear() + 1, 0, 0)),
      },
    },
  )

  const [transactions, updateLocalTransactions] = useQuery(
    listTransactionsRequest,
    filters,
  )

  const [newTransaction, insertTransaction] = useCommand(
    insertTransactionRequest,
  )

  const [updatedTransaction, updateTransaction] = useCommand(
    updateTransactionRequest,
  )

  const [updatedTransactions, updateTransactions] = useCommand(
    updateTransactionsRequest,
  )

  const [deletedTransaction, deleteTransaction] = useCommand(
    deleteTransactionRequest,
  )

  const [uploadedTransactions, uploadTransactions] = useFormDataCommand(
    uploadTransactionsRequest,
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
          updateLocalTransactions(
            paginationResponse.remove(deletedTransaction),
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
                updateLocalTransactions(paginationResponse.prepend(result)),
              onSome: () =>
                updateLocalTransactions(paginationResponse.replace(result)),
            }),
            () => {
              setFormState((state) => ({ ...state, open: false }))
            },
          )
        },
      }),
    )
  }

  async function onTransactionsUpdate(
    body: UpdateTransactionsInput,
  ): Promise<boolean> {
    const response = await updateTransactions({ body })

    pipe(
      response,
      Either.match({
        onLeft: constVoid,
        onRight: (updatedTransactions) =>
          updateLocalTransactions(
            paginationResponse.replace(updatedTransactions),
          ),
      }),
    )

    return Either.isRight(response)
  }

  async function onImportTransactionsFormSubmit(body: UploadTransactionsInput) {
    const transactions = await uploadTransactions({ body })

    pipe(
      transactions,
      Either.match({
        onLeft: constVoid,
        onRight: (transactions) => {
          updateLocalTransactions(paginationResponse.fromNodes(transactions))
          setImportDialogOpen(false)
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
            <Button onClick={() => setImportDialogOpen(true)}>
              Import transactions
            </Button>
          </Stack>
        </Paper>
        <Query
          response={pipe(
            transactions,
            NetworkResponse.withErrorFrom(deletedTransaction),
          )}
          render={(transactions) => (
            <SelectableTransactionsPage
              transactions={transactions}
              filters={filters.query}
              updatedTransactionsResponse={updatedTransactions}
              onFiltersChange={onFiltersChange}
              onEditTransactionButtonClick={onEditTransactionButtonClick}
              onDeleteTransactionButtonClick={onDeleteTransactionButtonClick}
              onTransactionsUpdate={onTransactionsUpdate}
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
      <ImportTransactionsDialog
        isOpen={importDialogIsOpen}
        networkResponse={uploadedTransactions}
        onClose={() => setImportDialogOpen(false)}
        onSubmit={onImportTransactionsFormSubmit}
      />
    </Container>
  )
}

export interface SelectableTransaction extends TransactionWithCategories {
  isSelected: boolean
}

interface SelectableTransactionsPageProps {
  transactions: PaginationResponse<TransactionWithCategories>
  filters: ListTransactionsInput
  updatedTransactionsResponse: NetworkResponse.NetworkResponse<
    HttpError,
    readonly TransactionWithCategories[]
  >
  onFiltersChange(filters: ListTransactionsInput): void
  onEditTransactionButtonClick(transaction: TransactionWithCategories): void
  onDeleteTransactionButtonClick(transaction: TransactionWithCategories): void
  onTransactionsUpdate(data: UpdateTransactionsInput): Promise<boolean>
}

function SelectableTransactionsPage(props: SelectableTransactionsPageProps) {
  const [selectableTransactions, setSelectableTransactions] = useState<
    PaginationResponse<SelectableTransaction>
  >(
    pipe(
      props.transactions,
      paginationResponse.mapNodes((transaction) => ({
        ...transaction,
        isSelected: false,
      })),
    ),
  )

  function onTransactionSelectionChange(id: string): void {
    setSelectableTransactions(
      paginationResponse.mapNodes((transaction) => {
        if (transaction.id === id) {
          return { ...transaction, isSelected: !transaction.isSelected }
        } else {
          return transaction
        }
      }),
    )
  }

  function onAllTransactionsSelectionChange(selection: boolean) {
    setSelectableTransactions(
      paginationResponse.mapNodes((transaction) => ({
        ...transaction,
        isSelected: selection,
      })),
    )
  }

  async function onTransactionsUpdate(
    data: Omit<UpdateTransactionsInput, "ids">,
  ): Promise<boolean> {
    const ids: string[] = selectableTransactions.edges
      .filter((edge) => edge.node.isSelected)
      .map((edge) => edge.node.id)

    return props.onTransactionsUpdate({ ids, ...data })
  }
  useEffect(() => {
    pipe(
      props.transactions,
      paginationResponse.mapNodes((transaction) => ({
        ...transaction,
        isSelected: false,
      })),
      setSelectableTransactions,
    )
  }, [props.transactions])

  return (
    <Stack spacing={1.5}>
      <TransactionFilters
        selectableTransactions={selectableTransactions}
        updateNetworkResponse={props.updatedTransactionsResponse}
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
