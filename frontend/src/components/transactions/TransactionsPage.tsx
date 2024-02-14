import { Container, Paper, Stack, Typography } from "@mui/material"
import { useState } from "react"
import { useCommand, useQuery, useRequestData } from "../../hooks/network"
import Query from "../Query"
import { PaginationResponse as PaginationResponseType } from "../../globalDomain"
import TransactionsTable from "./TransactionsTable"
import TransactionFilters from "./filters/TransactionFilters"
import { listTransactionsRequest, updateTransactionsRequest } from "./api"
import { Either, pipe } from "effect"
import { constFalse } from "effect/Function"
import { PaginationResponse } from "../../network/PaginationResponse"
import {
  ListTransactionsInput,
  TransactionWithCategories,
  UpdateTransactionsInput,
} from "./domain"

// interface TransactionFormState {
//   open: boolean
//   subject: Transaction | null
// }

// function transactionsQueryTransformer(
//   response: PaginatedResponse<Transaction>,
// ): PaginatedResponse<SelectableTransaction> {
//   const [transactions, count] = response

//   return [
//     transactions.map((t) => {
//       t["isSelected"] = false
//       return t as SelectableTransaction
//     }),
//     count,
//   ]
// }

export default function TransactionsPage() {
  // const [importDialogIsOpen, setImportDialogOpen] = useState(false)

  // const [formState, setFormState] = useState<TransactionFormState>({
  //   open: false,
  //   subject: null,
  // })

  const [filters, setFilters] = useRequestData<typeof listTransactionsRequest>({
    query: {
      direction: "forward",
      count: 100,
      subject: "description",
      search_query: "",
      categories: "all",
      date_since: new Date(new Date().getFullYear() - 1, 0, 1),
      date_until: new Date(new Date().getFullYear(), 0, 0),
    },
  })

  // const [params, setParams] = useState<FindTransactionsParams>({
  //   findBy: FindTransactionsBy.DESCRIPTION,
  //   page: 0,
  //   perPage: 100,
  //   startDate: new Date(
  //     Date.UTC(new Date().getFullYear() - 1, 0, 1),
  //   ).toISOString(),
  //   endDate: new Date(Date.UTC(new Date().getFullYear(), 0, 1)).toISOString(),
  //   categoryMode: CategoryMode.ALL,
  // })

  const [transactions] = useQuery(listTransactionsRequest, filters)

  // const [createTransactionResponse, createTransaction] = useCommand<
  //   TransactionCreationBody,
  //   Transaction
  // >("POST", "/transactions/")

  // const [updateTransactionResponse, updateTransaction] = useCommand<
  //   TransactionUpdateBody,
  //   Transaction
  // >("PATCH", "/transactions/")

  // const [, deleteTransaction] = useCommand<TransactionUpdateBody, Transaction>(
  //   "DELETE",
  //   "/transactions/",
  // )

  // const selectedCount = paginatedTransactions
  //   .map(([transactions]) =>
  //     transactions.reduce((sum, t) => {
  //       if (t.isSelected) {
  //         return sum + 1
  //       } else {
  //         return sum
  //       }
  //     }, 0),
  //   )
  //   .getOrElse(0)

  // function onImportSubmit(): void {
  //   setImportDialogOpen(false)
  //   fetchTransactions()
  // }

  function onFiltersChange(filters: ListTransactionsInput): void {
    setFilters({ query: filters })
  }

  // function onEditTransactionButtonClick(transaction: Transaction): void {
  //   setFormState({ open: true, subject: transaction })
  // }

  // async function onDeleteTransactionButtonClick(
  //   deleted: Transaction,
  // ): Promise<void> {
  //   const result = await deleteTransaction({
  //     ...deleted,
  //     categoryIds: deleted.categories.map((category) => category.id),
  //   })

  //   if (result !== null) {
  //     updateTransactions(([transactions, count]) => [
  //       transactions.filter((transaction) => transaction.id !== deleted.id),
  //       count,
  //     ])
  //   }
  // }

  // async function onTransactionFormSubmit(
  //   data: TransactionCreationBody,
  // ): Promise<void> {
  //   if (formState.subject === null) {
  //     const result = await createTransaction(data)

  //     if (result !== null) {
  //       updateTransactions(([transactions, count]) => [
  //         [
  //           {
  //             ...result,
  //             isSelected: false,
  //           },
  //           ...transactions,
  //         ],
  //         count,
  //       ])
  //     }
  //   } else {
  //     const result = await updateTransaction({
  //       ...data,
  //       id: formState.subject.id,
  //     })

  //     if (result !== null) {
  //       updateTransactions(([transactions, count]) => [
  //         transactions.map((transaction) => {
  //           if (transaction.id === result.id) {
  //             return { ...result, isSelected: false }
  //           } else {
  //             return transaction
  //           }
  //         }),
  //         count,
  //       ])
  //     }
  //   }

  //   setFormState((formState) => ({ ...formState, open: false }))
  // }

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
          {/* <Stack direction="row" spacing={0.5}>
            <Button onClick={() => setFormState({ open: true, subject: null })}>
              Add transaction
            </Button>
            <Button onClick={() => setImportDialogOpen(true)}>
              Import transactions
            </Button>
          </Stack> */}
        </Paper>
        <Query
          response={transactions}
          render={(transactions) => (
            <SelectableTransactionsPage
              transactions={transactions}
              filters={filters.query}
              onFiltersChange={onFiltersChange}
            />
          )}
        />
      </Stack>
      {/* <ImportTransactionsDialog
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
            networkResponse={
              formState.subject === null
                ? createTransactionResponse
                : updateTransactionResponse
            }
            onSubmit={onTransactionFormSubmit}
            onCancel={() =>
              setFormState((state) => ({ ...state, open: false }))
            }
          />
        </DialogContent>
      </Dialog> */}
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
}

function SelectableTransactionsPage(props: SelectableTransactionsPageProps) {
  const [state, setState] = useState<
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
    setState(
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
    setState(
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
    const ids: string[] = state.edges
      .filter((edge) => edge.node.isSelected)
      .map((edge) => edge.node.id)

    const response = await bulkUpdateTransactions({ body: { ids, ...data } })

    return pipe(
      response,
      Either.match({
        onLeft: constFalse,
        onRight: (updatedTransactions) => {
          setState(
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
        selectableTransactions={state}
        updateNetworkResponse={updatedTransactions}
        filters={props.filters}
        onFiltersChange={props.onFiltersChange}
        onUpdate={onTransactionsUpdate}
      />
      <TransactionsTable
        selectableTransactions={state}
        filters={props.filters}
        onFiltersChange={props.onFiltersChange}
        onTransactionSelectionChange={onTransactionSelectionChange}
        onAllTransactionsSelectionChange={onAllTransactionsSelectionChange}
        // onEditTransactionButtonClick={onEditTransactionButtonClick}
        // onDeleteTransactionButtonClick={onDeleteTransactionButtonClick}
      />
    </Stack>
  )
}
