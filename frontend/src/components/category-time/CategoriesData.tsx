import {
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material"
import { TransactionsByTimeAndCategory } from "./domain"
import { BarChart } from "@mui/x-charts"
import { Category } from "../categories/domain"

interface Props {
  selection: readonly Category[]
  data: TransactionsByTimeAndCategory["categories"]
}

export default function CategoriesData(props: Props) {
  if (props.data.length > 0) {
    const nonMetaCategoriesTotalValue = props.data
      .filter((category) => !category.is_meta)
      .reduce((sum, category) => sum + category.total, 0)

    const selectedCategoryIds = props.selection.map((category) => category.id)

    const nonSelectedCategories = props.data
      .filter((category) => !selectedCategoryIds.includes(category.id))
      .sort((a, b) => a.total - b.total)

    if (nonSelectedCategories.length > 0) {
      return (
        <Stack>
          <Typography variant="h5">Subcategories</Typography>
          <BarChart
            // @ts-expect-error this is ok as long as only numbers are used for the chart
            dataset={nonSelectedCategories}
            xAxis={[
              {
                scaleType: "band",
                dataKey: "name",
              },
            ]}
            series={[
              {
                dataKey: "total",
                valueFormatter: (n: number) => {
                  const percentage = Math.round(
                    (n / nonMetaCategoriesTotalValue) * 100,
                  ).toFixed(2)

                  if (n >= 0) {
                    return `€${n.toFixed(2)} (${percentage}%)`
                  } else {
                    return `-€${Math.abs(n).toFixed(2)} (${percentage}%)`
                  }
                },
              },
            ]}
            height={600}
          />
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Min transaction value (€)</TableCell>
                  <TableCell align="right">Max transaction value (€)</TableCell>
                  <TableCell align="right">Total (€)</TableCell>
                  <TableCell align="right">% (€)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {props.data.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.name}</TableCell>
                    <TableCell align="right">
                      {entry.min_transaction_value}
                    </TableCell>
                    <TableCell align="right">
                      {entry.max_transaction_value}
                    </TableCell>
                    <TableCell align="right">{entry.total}</TableCell>
                    <TableCell align="right">
                      {Math.round(
                        (entry.total / nonMetaCategoriesTotalValue) * 100,
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      )
    } else {
      return null
    }
  } else {
    return null
  }
}
