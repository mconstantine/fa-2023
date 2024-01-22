import { Container, Paper, Typography } from "@mui/material"
import { isRouteErrorResponse, useRouteError } from "react-router-dom"

export default function ErrorPage() {
  const error = useRouteError() as Error

  return (
    <Container>
      <Paper sx={{ m: 3, p: 3 }}>
        <Typography variant="h5" sx={{ mb: 1.5 }}>
          Something went unexpectedly!
        </Typography>
        <Typography>
          <em>
            {isRouteErrorResponse(error) ? error.statusText : error.message}
          </em>
        </Typography>
      </Paper>
    </Container>
  )
}
