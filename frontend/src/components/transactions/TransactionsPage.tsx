import { Button, Container, Paper, Stack, Typography } from "@mui/material"
import { useState } from "react"
import ImportTransactionsDialog, {
  ImportFormData,
} from "./ImportTransactionsDialog"

export default function TransactionsPage() {
  const [isImportDialogOpen, setIsImportDialodOpen] = useState(false)

  function onSubmit(data: ImportFormData): void {
    console.log("TODO:", data)
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
      </Stack>
      <ImportTransactionsDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialodOpen(false)}
        onSubmit={onSubmit}
      />
    </Container>
  )
}
