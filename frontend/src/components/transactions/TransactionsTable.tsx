import {
  Checkbox,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material"
import { PaginationQuery, PaginationResponse } from "../../globalDomain"
import { ChangeEvent } from "react"
import TransactionsTableRow from "./TransactonsTableRow"
import { ListTransactionsInput } from "./api"
import { usePagination } from "../../hooks/usePagination"
import Pagination from "../Pagination"
import { SelectableTransaction } from "./TransactionsPage"

interface Props {
  selectableTransactions: PaginationResponse<SelectableTransaction>
  filters: ListTransactionsInput
  onFiltersChange(filters: ListTransactionsInput): void
  onTransactionSelectionChange(transactionId: string): void
  onAllTransactionsSelectionChange(selection: boolean): void
  // onEditTransactionButtonClick(transaction: Transaction): void
  // onDeleteTransactionButtonClick(transaction: Transaction): void
}

export default function TransactionsTable(props: Props) {
  const paginationProps = usePagination({
    filters: props.filters,
    paginationResponse: props.selectableTransactions,
    rowsPerPageOptions: [50, 100, 500, 1000],
    onFiltersChange: onPaginationFiltersChange,
  })

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

  // const total = props.transactions
  //   .reduce((sum, transaction) => sum + transaction.value, 0)
  //   .toFixed(2)

  // const onRowsPerPageChange: ChangeEventHandler<HTMLInputElement> = (event) => {
  //   const perPage = parseInt(event.target.value)

  //   if (!Number.isNaN(perPage)) {
  //     props.onParamsChange({ page: 0, perPage })
  //   }
  // }

  // const [deleteTransaction, deleteTransactionConfirmationDialog] =
  //   useConfirmation(props.onDeleteTransactionButtonClick, (transaction) => ({
  //     title: "Do you really want to delete this transaction?",
  //     message: `Deleting transaction "${transaction.description}" cannot be undone!`,
  //     yesButtonLabel: "Yes",
  //     noButtonLabel: "No",
  //   }))

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

  // function onEditButtonClick(
  //   transaction: Transaction,
  // ): MouseEventHandler<HTMLButtonElement> {
  //   return (event) => {
  //     event.stopPropagation()
  //     props.onEditTransactionButtonClick(transaction)
  //   }
  // }

  // function onDeleteButtonClick(
  //   transaction: Transaction,
  // ): MouseEventHandler<HTMLButtonElement> {
  //   return (event) => {
  //     event.stopPropagation()
  //     deleteTransaction(transaction)
  //   }
  // }

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
              {props.selectableTransactions.edges.map((edge) => (
                <TransactionsTableRow
                  key={edge.cursor}
                  selectableTransaction={edge.node}
                  onSelectClick={() => onSelectOneClick(edge.node.id)}
                  // onEditButtonClick={onEditButtonClick(edge)}
                  // onDeleteButtonClick={onDeleteButtonClick(edge)}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Pagination {...paginationProps} />
        {/* <Toolbar sx={{ justifyContent: "end" }}>
          <Typography>Total: {total}</Typography>
        </Toolbar> */}
      </Paper>
      {/* {deleteTransactionConfirmationDialog} */}
    </>
  )
}
