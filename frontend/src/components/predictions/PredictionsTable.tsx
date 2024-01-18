import {
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Toolbar,
  Typography,
} from "@mui/material"
import { CategoriesAggregation } from "./domain"

interface Props {
  categoriesAggregation: CategoriesAggregation[]
}

export default function PredictionsTable(props: Props) {
  const incomes = props.categoriesAggregation.filter(
    (entry) => entry.transactionsTotal > 0,
  )

  const outcomes = props.categoriesAggregation.filter(
    (entry) => entry.transactionsTotal <= 0,
  )

  const total = props.categoriesAggregation
    .reduce((sum, entry) => sum + entry.transactionsTotal, 0)
    .toFixed(2)

  const sorted = [...incomes, ...outcomes]

  return (
    <Stack>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell>Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((entry) => (
              <TableRow key={entry.categoryId}>
                <TableCell>{entry.categoryName ?? "Uncategorized"}</TableCell>
                <TableCell>{entry.transactionsTotal.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Toolbar sx={{ justifyContent: "end" }}>
        <Typography>Total: {total}</Typography>
      </Toolbar>
    </Stack>
  )
}
