import { CssBaseline } from "@mui/material"
import Header from "./components/Header"
import Categories from "./components/categories/Categories"
import { ThemeProvider } from "./contexts/ThemeContext"

function App() {
  return (
    <ThemeProvider>
      <CssBaseline />
      <Header />
      <Categories />
    </ThemeProvider>
  )
}

export default App
