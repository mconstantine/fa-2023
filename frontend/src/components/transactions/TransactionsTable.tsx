import {
  Checkbox,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Toolbar,
  Typography,
} from "@mui/material"
import { Transaction } from "./domain"
import { PaginationParams } from "../../globalDomain"
import {
  ChangeEvent,
  ChangeEventHandler,
  MouseEvent,
  MouseEventHandler,
} from "react"
import { Delete, Edit } from "@mui/icons-material"
import { useConfirmation } from "../../hooks/useConfirmation"

export interface SelectableTransaction extends Transaction {
  isSelected: boolean
}

interface Props {
  transactions: SelectableTransaction[]
  transactionsCount: number
  params: PaginationParams
  onTransactionsSelectionChange(selected: boolean, ids: string[]): void
  onParamsChange(params: PaginationParams): void
  onEditTransactionButtonClick(transaction: Transaction): void
  onDeleteTransactionButtonClick(transaction: Transaction): void
}

export default function TransactionsTable(props: Props) {
  const selectedRowsCount = props.transactions.filter(
    (transaction) => transaction.isSelected,
  ).length

  const total = props.transactions
    .reduce((sum, transaction) => sum + transaction.value, 0)
    .toFixed(2)

  const onRowsPerPageChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const perPage = parseInt(event.target.value)

    if (!Number.isNaN(perPage)) {
      props.onParamsChange({ page: 0, perPage })
    }
  }

  const [deleteTransaction, deleteTransactionConfirmationDialog] =
    useConfirmation(props.onDeleteTransactionButtonClick, (transaction) => ({
      title: "Do you really want to delete this transaction?",
      message: `Deleting transaction "${transaction.description}" cannot be undone!`,
      yesButtonLabel: "Yes",
      noButtonLabel: "No",
    }))

  function onPageChange(
    _: MouseEvent<HTMLButtonElement> | null,
    page: number,
  ): void {
    props.onParamsChange({ ...props.params, page })
  }

  function onSelectAllClick(
    _: ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) {
    props.onTransactionsSelectionChange(
      checked,
      props.transactions.map((transaction) => transaction.id),
    )
  }

  function onSelectOneClick(
    id: string,
  ): (event: MouseEvent<HTMLTableRowElement>) => void {
    return () => {
      const transaction = props.transactions.find(
        (transaction) => transaction.id === id,
      )

      if (typeof transaction !== "undefined") {
        props.onTransactionsSelectionChange(!transaction.isSelected, [id])
      }
    }
  }

  function onEditButtonClick(
    transaction: Transaction,
  ): MouseEventHandler<HTMLButtonElement> {
    return (event) => {
      event.stopPropagation()
      props.onEditTransactionButtonClick(transaction)
    }
  }

  function onDeleteButtonClick(
    transaction: Transaction,
  ): MouseEventHandler<HTMLButtonElement> {
    return (event) => {
      event.stopPropagation()
      deleteTransaction(transaction)
    }
  }

  return (
    <>
      <Paper>
        <TableContainer sx={{ maxHeight: 568 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={
                      selectedRowsCount > 0 &&
                      selectedRowsCount < props.transactions.length
                    }
                    checked={selectedRowsCount === props.transactions.length}
                    onChange={onSelectAllClick}
                    inputProps={{
                      "aria-label": "select all transactions",
                    }}
                  />
                </TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Value</TableCell>
                <TableCell sx={{ minWidth: 116, maxWidth: 116, width: 116 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {props.transactions.map((transaction) => (
                <TableRow
                  key={transaction.id}
                  hover
                  onClick={onSelectOneClick(transaction.id)}
                  role="checkbox"
                  aria-checked={transaction.isSelected}
                  tabIndex={-1}
                  selected={transaction.isSelected}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      checked={transaction.isSelected}
                      inputProps={{
                        "aria-labelledby": transaction.id,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(transaction.date).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    {transaction.description}
                    <br />
                    {transaction.categories
                      .map((category) => category.name)
                      .join(", ")}
                  </TableCell>
                  <TableCell align="right">
                    {transaction.value.toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ minWidth: 116, maxWidth: 116, width: 116 }}>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton
                        aria-label="Edit"
                        onClick={onEditButtonClick(transaction)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        aria-label="Delete"
                        onClick={onDeleteButtonClick(transaction)}
                      >
                        <Delete />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          rowsPerPageOptions={[100, 500, 1000]}
          count={props.transactionsCount}
          rowsPerPage={props.params.perPage}
          page={props.params.page}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
        />
        <Toolbar sx={{ justifyContent: "end" }}>
          <Typography>Total: {total}</Typography>
        </Toolbar>
      </Paper>
      {deleteTransactionConfirmationDialog}
    </>
  )
}
