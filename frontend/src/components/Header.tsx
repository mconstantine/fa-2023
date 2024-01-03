import { Menu } from "@mui/icons-material"
import {
  AppBar,
  Box,
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

export default function Header() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <AppBar position="sticky">
      <Container maxWidth="xl">
        <Toolbar>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconButton aria-label="Menu" onClick={() => setIsDrawerOpen(true)}>
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
            <ListItemButton>
              <Link to="/">
                <ListItemText>Transactions</ListItemText>
              </Link>
            </ListItemButton>
            <ListItemButton>
              <Link to="/categories">
                <ListItemText>Categories</ListItemText>
              </Link>
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
    </AppBar>
  )
}
