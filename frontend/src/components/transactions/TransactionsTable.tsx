import {
  Checkbox,
  FormControl,
  FormControlLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Toolbar,
  Typography,
} from "@mui/material"
import { PaginationQuery, PaginationResponse } from "../../globalDomain"
import { ChangeEvent, MouseEventHandler, useState } from "react"
import TransactionsTableRow, {
  SelectableTransactionWithWarnings,
} from "./TransactonsTableRow"
import { usePagination } from "../../hooks/usePagination"
import Pagination from "../Pagination"
import { SelectableTransaction } from "./TransactionsPage"
import { ListTransactionsInput, TransactionWithCategories } from "./domain"
import { useConfirmation } from "../../hooks/useConfirmation"

interface Props {
  selectableTransactions: PaginationResponse<SelectableTransaction>
  filters: ListTransactionsInput
  onFiltersChange(filters: ListTransactionsInput): void
  onTransactionSelectionChange(transactionId: string): void
  onAllTransactionsSelectionChange(selection: boolean): void
  onEditTransactionButtonClick(transaction: TransactionWithCategories): void
  onDeleteTransactionButtonClick(transaction: TransactionWithCategories): void
}

export default function TransactionsTable(props: Props) {
  const paginationProps = usePagination({
    filters: props.filters,
    paginationResponse: props.selectableTransactions,
    rowsPerPageOptions: [50, 100, 500, 1000],
    onFiltersChange: onPaginationFiltersChange,
  })

  const [showWarnings, setShowWarnings] = useState(false)

  const [deleteTransaction, deleteTransactionConfirmationDialog] =
    useConfirmation(props.onDeleteTransactionButtonClick, (transaction) => ({
      title: "Do you really want to delete this transaction?",
      message: `Deleting transaction "${transaction.description}" cannot be undone!`,
      yesButtonLabel: "Yes",
      noButtonLabel: "No",
    }))

  const selectedRowsCount = props.selectableTransactions.edges.reduce(
    (count, edge) => {
      if (edge.node.isSelected) {
        return count + 1
      } else {
        return count
      }
    },
    0,
  )

  const total = props.selectableTransactions.edges
    .reduce((sum, transaction) => sum + transaction.node.value, 0)
    .toFixed(2)

  const transactionsWithWarnings = props.selectableTransactions.edges.map(
    (edge) => addWarningsToSelectableTransaction(edge.node),
  )

  function onPaginationFiltersChange(filters: PaginationQuery): void {
    props.onFiltersChange({
      ...props.filters,
      ...filters,
    })
  }

  function onSelectAllClick(
    _: ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) {
    props.onAllTransactionsSelectionChange(checked)
  }

  function onSelectOneClick(id: string) {
    props.onTransactionSelectionChange(id)
  }

  function onEditButtonClick(
    transaction: TransactionWithCategories,
  ): MouseEventHandler<HTMLButtonElement> {
    return (event) => {
      event.stopPropagation()
      props.onEditTransactionButtonClick(transaction)
    }
  }

  function onDeleteButtonClick(
    transaction: TransactionWithCategories,
  ): MouseEventHandler<HTMLButtonElement> {
    return (event) => {
      event.stopPropagation()
      deleteTransaction(transaction)
    }
  }

  return (
    <>
      <Paper>
        <TableContainer sx={{ maxHeight: 535 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={
                      selectedRowsCount > 0 &&
                      selectedRowsCount <
                        props.selectableTransactions.edges.length
                    }
                    checked={
                      selectedRowsCount ===
                      props.selectableTransactions.edges.length
                    }
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
              {transactionsWithWarnings
                .filter((transaction) => {
                  if (showWarnings) {
                    return (
                      transaction.hasMultipleNonMetaCategories ||
                      transaction.hasOnlyMetaCategories
                    )
                  } else {
                    return true
                  }
                })
                .map((transaction) => (
                  <TransactionsTableRow
                    key={transaction.id}
                    selectableTransaction={transaction}
                    isSelectingTransactions={selectedRowsCount > 0}
                    onSelectClick={() => onSelectOneClick(transaction.id)}
                    onEditButtonClick={onEditButtonClick(transaction)}
                    onDeleteButtonClick={onDeleteButtonClick(transaction)}
                  />
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Pagination {...paginationProps} />
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <FormControl>
            <FormControlLabel
              label="Show warnings"
              control={
                <Checkbox
                  checked={showWarnings}
                  onChange={(event) => setShowWarnings(event.target.checked)}
                />
              }
            />
          </FormControl>
          <Typography>Total: {total}</Typography>
        </Toolbar>
      </Paper>
      {deleteTransactionConfirmationDialog}
    </>
  )
}

function addWarningsToSelectableTransaction(
  transaction: SelectableTransaction,
): SelectableTransactionWithWarnings {
  // Warning: mutable code ahead
  const t = transaction as SelectableTransactionWithWarnings

  const hasOnlyMetaCategories =
    t.categories.length > 0 &&
    t.categories.every((category) => category.is_meta)

  const hasMultipleNonMetaCategories =
    t.categories.filter((category) => !category.is_meta).length > 1

  t.hasOnlyMetaCategories = hasOnlyMetaCategories
  t.hasMultipleNonMetaCategories = hasMultipleNonMetaCategories

  return t
}
