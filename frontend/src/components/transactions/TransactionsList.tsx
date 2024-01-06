import { List, ListItem, ListItemText, ListSubheader } from "@mui/material"
import { Transaction } from "./domain"

interface Props {
  transactions: Transaction[]
}

interface YearMonthGroup {
  localeDate: string
  transactions: Transaction[]
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
              <ListItem key={transaction.id}>
                <ListItemText
                  sx={{ overflow: "hidden" }}
                  primary={new Date(transaction.date).toLocaleDateString(
                    undefined,
                    {
                      year: "numeric",
                      month: "long",
                      day: "2-digit",
                    },
                  )}
                  secondary={transaction.description}
                />
              </ListItem>
            ))}
          </ul>
        </li>
      ))}
    </List>
  )
}
