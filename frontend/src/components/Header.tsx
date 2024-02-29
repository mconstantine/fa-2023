import { Menu } from "@mui/icons-material"
import {
  AppBar,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material"
import { useState } from "react"
import { Link } from "react-router-dom"
import { routes } from "../routes"
import { useAuthContext } from "../contexts/AuthContext"

export default function Header() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const authContext = useAuthContext()

  return (
    <AppBar position="sticky">
      <Container maxWidth="xl">
        <Toolbar>
          <Stack
            direction="row"
            justifyContent="space-between"
            sx={{ width: "100%" }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <IconButton
                aria-label="Menu"
                onClick={() => setIsDrawerOpen(true)}
              >
                <Menu />
              </IconButton>
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
            </Stack>
            {(() => {
              switch (authContext.type) {
                case "Anonymous":
                  return null
                case "Authenticated":
                  return <Button onClick={authContext.logout}>Logout</Button>
              }
            })()}
          </Stack>
        </Toolbar>
      </Container>
      <Drawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        <Box
          sx={{ minWidth: 250 }}
          role="presentation"
          onClick={() => setIsDrawerOpen(false)}
          onKeyDown={() => setIsDrawerOpen(false)}
        >
          <List>
            {routes.map((route) => (
              <ListItemButton key={route.path}>
                <Link to={route.path}>
                  <ListItemText>{route.label}</ListItemText>
                </Link>
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  )
}
