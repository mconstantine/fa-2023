import {
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material"
import { TimeAggregation, TimeRange } from "./domain"
import { BarChart } from "@mui/x-charts"

interface Props {
  year: number
  timeRange: TimeRange
  data: TimeAggregation[]
}

export default function CategoryTimeData(props: Props) {
  const theme = useTheme()

  const filledData = (() => {
    if (props.data.length === 0) {
      return []
    } else {
      const timeMin = 1

      const timeMax: number = (() => {
        switch (props.timeRange) {
          case TimeRange.MONTH:
            return 12
          case TimeRange.WEEK:
            return 51
          case TimeRange.DAY:
            return props.year % 4 === 0 ? 366 : 365
        }
      })()

      const dataMin = Math.min(...props.data.map((entry) => entry.time))
      const dataMax = Math.max(...props.data.map((entry) => entry.time))
      const min = Math.min(timeMin, dataMin)
      const max = Math.max(timeMax, dataMax)

      return new Array(max - min + 1).fill(null).map((_, index) => {
        const entry = props.data.find((entry) => entry.time === index + 1)

        if (typeof entry === "undefined") {
          return {
            time: index + 1,
            total: 0,
          }
        } else {
          return entry
        }
      })
    }
  })()

  const timeRangeLabel = (() => {
    switch (props.timeRange) {
      case TimeRange.MONTH:
        return "Month"
      case TimeRange.WEEK:
        return "Week"
      case TimeRange.DAY:
        return "Day"
    }
  })()

  const timeRangeTitle = (() => {
    switch (props.timeRange) {
      case TimeRange.MONTH:
        return "Monthly"
      case TimeRange.WEEK:
        return "Weekly"
      case TimeRange.DAY:
        return "Daily"
    }
  })()

  if (props.data.length > 0) {
    return (
      <Stack spacing={3}>
        <BarChart
          dataset={filledData}
          xAxis={[
            {
              scaleType: "band",
              dataKey: "time",
              label: timeRangeLabel,
              valueFormatter: (n: number) => {
                switch (props.timeRange) {
                  case TimeRange.MONTH:
                    return new Date(props.year, n - 1, 1).toLocaleString(
                      undefined,
                      { month: "short" },
                    )
                  case TimeRange.WEEK:
                    return `Week ${n}`
                  case TimeRange.DAY:
                    return new Date(props.year, 0, n).toLocaleDateString(
                      undefined,
                      {
                        month: "short",
                        day: "numeric",
                      },
                    )
                }
              },
            },
          ]}
          yAxis={[
            {
              valueFormatter: (n: number) => {
                if (n >= 0) {
                  return `€${n}`
                } else {
                  return `-€${Math.abs(n)}`
                }
              },
            },
          ]}
          series={[
            {
              dataKey: "total",
              valueFormatter: (n: number) => n.toFixed(2),
              color: theme.palette.primary.main,
            },
          ]}
          height={600}
        />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{timeRangeTitle} Avg (€)</TableCell>
                <TableCell>{timeRangeTitle} Min (€)</TableCell>
                <TableCell>{timeRangeTitle} Max (€)</TableCell>
                <TableCell>Total (€)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>
                  {(
                    filledData.reduce((sum, entry) => sum + entry.total, 0) /
                    filledData.length
                  ).toFixed(2)}
                </TableCell>
                <TableCell>
                  {Math.min(...filledData.map((entry) => entry.total)).toFixed(
                    2,
                  )}
                </TableCell>
                <TableCell>
                  {Math.max(...filledData.map((entry) => entry.total)).toFixed(
                    2,
                  )}
                </TableCell>
                <TableCell>
                  {filledData
                    .reduce((sum, entry) => sum + entry.total, 0)
                    .toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    )
  } else {
    return <Typography>No data for this year!</Typography>
  }
}
