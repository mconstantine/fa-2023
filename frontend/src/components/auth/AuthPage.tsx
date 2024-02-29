import { Button, Container, Paper, Stack, Typography } from "@mui/material"
import { useState } from "react"
import RegistrationForm from "./RegistrationForm"
import LoginForm from "./LoginForm"

type AuthMode = "Registration" | "Login"

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("Login")

  const formTitle = (() => {
    switch (mode) {
      case "Registration":
        return "Register"
      case "Login":
        return "Login"
    }
  })()

  const switchModeTitle = (() => {
    switch (mode) {
      case "Registration":
        return "Login"
      case "Login":
        return "Register"
    }
  })()

  function switchMode() {
    setMode(() => {
      switch (mode) {
        case "Registration":
          return "Login"
        case "Login":
          return "Registration"
      }
    })
  }

  return (
    <Container>
      <Stack spacing={1.5} sx={{ mt: 1.5, mb: 1.5 }}>
        <Paper
          sx={{
            mt: 1.5,
            p: 1.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h5">{formTitle}</Typography>
          <Button onClick={switchMode}>{switchModeTitle}</Button>
        </Paper>
        {(() => {
          switch (mode) {
            case "Registration":
              return <RegistrationForm />
            case "Login":
              return <LoginForm />
          }
        })()}
      </Stack>
    </Container>
  )
}
