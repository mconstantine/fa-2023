import {
  Checkbox,
  Paper,
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
import { ChangeEvent, ChangeEventHandler, MouseEvent } from "react"

export interface SelectableTransaction extends Transaction {
  isSelected: boolean
}

interface Props {
  transactions: SelectableTransaction[]
  transactionsCount: number
  onTransactionsSelectionChange(selected: boolean, ids: string[]): void
  params: PaginationParams
  onParamsChange(params: PaginationParams): void
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

  return (
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
                    selectedRowsCount < props.params.perPage
                  }
                  checked={selectedRowsCount === props.params.perPage}
                  onChange={onSelectAllClick}
                  inputProps={{
                    "aria-label": "select all transactions",
                  }}
                />
              </TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Value</TableCell>
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
  )
}
