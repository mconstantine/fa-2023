import {
  Checkbox,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
} from "@mui/material"
import { Transaction } from "./domain"

export interface SelectableTransaction extends Transaction {
  isSelected: boolean
}

interface YearMonthGroup {
  localeDate: string
  transactions: SelectableTransaction[]
}

interface Props {
  transactions: SelectableTransaction[]
  onTransactionSelectionChange(transaction: SelectableTransaction): void
}

export default function TransactionsList(props: Props) {
  const groupedByYearMonth = props.transactions.reduce<YearMonthGroup[]>(
    (result, transaction) => {
      const localeDate = new Date(transaction.date).toLocaleDateString(
        undefined,
        {
          year: "numeric",
          month: "long",
        },
      )

      if (result[result.length - 1]?.localeDate === localeDate) {
        result[result.length - 1]!.transactions.push(transaction)
      } else {
        result.push({
          localeDate,
          transactions: [transaction],
        })
      }

      return result
    },
    [],
  )

  return (
    <List subheader={<li />}>
      {groupedByYearMonth.map((group) => (
        <li key={group.localeDate}>
          <ul>
            <ListSubheader>{group.localeDate}</ListSubheader>
            {group.transactions.map((transaction) => (
              <ListItemButton
                key={transaction.id}
                onClick={() => {
                  transaction.isSelected = !transaction.isSelected
                  props.onTransactionSelectionChange(transaction)
                }}
              >
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={transaction.isSelected}
                    tabIndex={-1}
                    disableRipple
                    inputProps={{
                      "aria-labelledby": `Select transaction`,
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  sx={{ overflow: "hidden" }}
                  primary={`${new Date(transaction.date).toLocaleDateString(
                    undefined,
                    {
                      year: "numeric",
                      month: "long",
                      day: "2-digit",
                    },
                  )}, ${transaction.value.toFixed(2)}`}
                  secondary={transaction.description}
                />
              </ListItemButton>
            ))}
          </ul>
        </li>
      ))}
    </List>
  )
}
