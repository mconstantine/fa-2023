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
import { SelectableTransaction } from "./TransactionsTable"
import { MouseEventHandler } from "react"

interface Props {
  transaction: SelectableTransaction
  onSelectClick: MouseEventHandler<HTMLTableRowElement>
  onEditButtonClick: MouseEventHandler<HTMLButtonElement>
  onDeleteButtonClick: MouseEventHandler<HTMLButtonElement>
}

export default function TransactionsTableRow(props: Props) {
  const hasMultipleNonMetaCategories =
    props.transaction.categories.filter((category) => !category.isMeta).length >
    1

  return (
    <TableRow
      key={props.transaction.id}
      hover
      onClick={props.onSelectClick}
      role="checkbox"
      aria-checked={props.transaction.isSelected}
      tabIndex={-1}
      selected={props.transaction.isSelected}
      sx={{ cursor: "pointer" }}
    >
      <TableCell padding="checkbox">
        <Checkbox
          color="primary"
          checked={props.transaction.isSelected}
          inputProps={{
            "aria-labelledby": props.transaction.id,
          }}
        />
      </TableCell>
      <TableCell>
        {new Date(props.transaction.date).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "2-digit",
        })}
      </TableCell>
      <TableCell>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Stack>
            <Typography variant="body2">
              {props.transaction.description}
            </Typography>
            <Typography variant="body2">
              {props.transaction.categories
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
      <TableCell align="right">{props.transaction.value.toFixed(2)}</TableCell>
      <TableCell sx={{ minWidth: 116, maxWidth: 116, width: 116 }}>
        <Stack direction="row" spacing={0.5}>
          <IconButton aria-label="Edit" onClick={props.onEditButtonClick}>
            <Edit />
          </IconButton>
          <IconButton aria-label="Delete" onClick={props.onDeleteButtonClick}>
            <Delete />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  )
}
