import { Delete, Edit, Warning } from "@mui/icons-material"
import {
  Checkbox,
  IconButton,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material"
import { MouseEventHandler } from "react"
import { SelectableTransaction } from "./TransactionsPage"

interface Props {
  selectableTransaction: SelectableTransaction
  isSelectingTransactions: boolean
  onSelectClick: MouseEventHandler<HTMLTableRowElement>
  onEditButtonClick: MouseEventHandler<HTMLButtonElement>
  onDeleteButtonClick: MouseEventHandler<HTMLButtonElement>
}

export default function TransactionsTableRow(props: Props) {
  const hasMultipleNonMetaCategories =
    props.selectableTransaction.categories.filter(
      (category) => !category.is_meta,
    ).length > 1

  return (
    <TableRow
      key={props.selectableTransaction.id}
      hover
      onClick={props.onSelectClick}
      role="checkbox"
      aria-checked={props.selectableTransaction.isSelected}
      tabIndex={-1}
      selected={props.selectableTransaction.isSelected}
      sx={{ cursor: "pointer" }}
    >
      <TableCell padding="checkbox">
        <Checkbox
          color="primary"
          checked={props.selectableTransaction.isSelected}
          inputProps={{
            "aria-labelledby": props.selectableTransaction.id,
          }}
        />
      </TableCell>
      <TableCell>
        {new Date(props.selectableTransaction.date).toLocaleDateString(
          undefined,
          {
            year: "numeric",
            month: "short",
            day: "2-digit",
          },
        )}
      </TableCell>
      <TableCell>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Stack>
            <Typography variant="body2">
              {props.selectableTransaction.description}
            </Typography>
            <Typography variant="body2">
              {props.selectableTransaction.categories
                .map((category) => category.name)
                .join(", ")}
            </Typography>
          </Stack>
          {hasMultipleNonMetaCategories ? (
            <Tooltip title="Multiple non meta categories. This duplicates transactions in predictions.">
              <Warning color="warning" />
            </Tooltip>
          ) : null}
        </Stack>
      </TableCell>
      <TableCell align="right">
        {props.selectableTransaction.value.toFixed(2)}
      </TableCell>
      <TableCell sx={{ minWidth: 116, maxWidth: 116, width: 116 }}>
        <Stack direction="row" spacing={0.5}>
          <IconButton
            aria-label="Edit"
            onClick={props.onEditButtonClick}
            disabled={props.isSelectingTransactions}
          >
            <Edit />
          </IconButton>
          <IconButton
            aria-label="Delete"
            onClick={props.onDeleteButtonClick}
            disabled={props.isSelectingTransactions}
          >
            <Delete />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  )
}
