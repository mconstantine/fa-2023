import {
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
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

export default function TimeData(props: Props) {
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

  const total = props.data.reduce((sum, entry) => sum + entry.total, 0)
  const values = props.data.map((entry) => entry.total)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const maxTimeValue = Math.max(...props.data.map((entry) => entry.time))

  if (props.data.length > 0) {
    return (
      <Stack>
        <Typography variant="h5">Time</Typography>
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
            <TableBody>
              <TableRow>
                <TableCell>{timeRangeTitle} average (€)</TableCell>
                <TableCell>{(total / maxTimeValue).toFixed(2)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{timeRangeTitle} min (€)</TableCell>
                <TableCell>{min.toFixed(2)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{timeRangeTitle} max (€)</TableCell>
                <TableCell>{max.toFixed(2)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Total (€)</TableCell>
                <TableCell>{total.toFixed(2)}</TableCell>
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
