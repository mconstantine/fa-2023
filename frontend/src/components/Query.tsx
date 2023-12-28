import { Box, CircularProgress, Paper, Typography } from "@mui/material"
import { NetworkResponse } from "../network/NetworkResponse"
import { ReactNode } from "react"

interface Props<T> {
  response: NetworkResponse<T>
  render: (data: T) => ReactNode
}

export default function Query<T>(props: Props<T>) {
  return props.response.match<ReactNode>({
    whenIdle: () => null,
    whenLoading: () => (
      <Box sx={{ textAlign: "center" }}>
        <CircularProgress
          sx={{
            mt: 3,
            mb: 3,
          }}
        />
      </Box>
    ),
    whenFailed: (response) => (
      <Paper sx={{ m: 3, p: 3 }}>
        <Typography variant="h6" color="error">
          Network Error (status code {response.status}): {response.message}
        </Typography>
      </Paper>
    ),
    whenSuccessful: (response) => props.render(response.data),
  })
}
