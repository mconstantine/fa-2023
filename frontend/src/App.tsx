import { CssBaseline } from "@mui/material"
import Header from "./components/Header"
import { ThemeProvider } from "./contexts/ThemeContext"
import CategoriesPage from "./components/categories/CategoriesPage"

function App() {
  return (
    <ThemeProvider>
      <CssBaseline />
      <Header />
      <CategoriesPage />
    </ThemeProvider>
  )
}

export default App
