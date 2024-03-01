import { Box, CircularProgress, Paper, Typography } from "@mui/material"
import * as NetworkResponse from "../network/NetworkResponse"
import { ReactNode } from "react"
import { HttpError } from "../hooks/network"
import { pipe } from "effect"

interface Props<T> {
  response: NetworkResponse.NetworkResponse<HttpError, T>
  render: (data: T) => ReactNode
}

export default function Query<T>(props: Props<T>) {
  return pipe(
    props.response,
    NetworkResponse.match<HttpError, T, ReactNode>({
      onIdle: () => null,
      onLoading: () => (
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress
            sx={{
              mt: 3,
              mb: 3,
            }}
          />
        </Box>
      ),
      onFailure: (error) => (
        <Paper sx={{ m: 3, p: 3 }}>
          <Typography variant="h6" color="error">
            Network Error (status code {error.code}): {error.message}
          </Typography>
        </Paper>
      ),
      onSuccess: props.render,
    }),
  )
}
