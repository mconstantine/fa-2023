import { Button, Container, Paper, Stack, Typography } from "@mui/material"
import { useState } from "react"
import ImportTransactionsDialog from "./ImportTransactionsDialog"
import { useQuery } from "../../hooks/network"
import Query from "../Query"
import { PaginatedResponse } from "../../globalDomain"
import { FindTransactionsParams, Transaction } from "./domain"
import TransactionsList from "./TransactionsList"
import TransactionFilters from "./filters/TransactionFilters"

export default function TransactionsPage() {
  const [isImportDialogOpen, setIsImportDialodOpen] = useState(false)

  const [params] = useState<FindTransactionsParams>({
    startDate: new Date(
      Date.UTC(new Date().getFullYear() - 1, 0, 1),
    ).toISOString(),
    endDate: new Date(Date.UTC(new Date().getFullYear(), 0, 1)).toISOString(),
  })

  const [transactions, , fetchTransactions] = useQuery<
    FindTransactionsParams,
    PaginatedResponse<Transaction>
  >("/transactions", params)

  function onSubmit(): void {
    setIsImportDialodOpen(false)
    fetchTransactions()
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
        <TransactionFilters />
        <Query
          response={transactions}
          render={([transactions]) => (
            <TransactionsList transactions={transactions} />
          )}
        />
      </Stack>
      <ImportTransactionsDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialodOpen(false)}
        onSubmit={onSubmit}
      />
    </Container>
  )
}
