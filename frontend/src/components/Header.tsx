import { AppBar, Container, Toolbar, Typography } from "@mui/material"

export default function Header() {
  return (
    <AppBar position="sticky">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            noWrap
            sx={{
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: "2px",
              color: "inherit",
            }}
          >
            FA2023
          </Typography>
        </Toolbar>
      </Container>
    </AppBar>
  )
}
