import { Box, CircularProgress, Paper, Typography } from "@mui/material"
import { Response } from "../network"

interface Props<T, O> {
  response: Response<T>
  render: (data: T) => O
}

export default function Query<T, O>(props: Props<T, O>) {
  switch (props.response.type) {
    case "loading":
      return (
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress
            sx={{
              mt: 3,
              mb: 3,
            }}
          />
        </Box>
      )
    case "failure":
      return (
        <Paper sx={{ m: 3, p: 3 }}>
          <Typography variant="h6" color="error">
            Network Error (status code {props.response.error.status}):{" "}
            {props.response.error.message}
          </Typography>
        </Paper>
      )
    case "success":
      return props.render(props.response.data)
  }
}
