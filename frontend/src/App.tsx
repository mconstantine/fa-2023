import { CssBaseline } from "@mui/material"
import Header from "./components/Header"
import { ThemeProvider } from "./contexts/ThemeContext"
import CategoriesPage from "./components/categories/CategoriesPage"
import { RouterProvider, createBrowserRouter } from "react-router-dom"
import ErrorPage from "./ErrorPage"

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <CategoriesPage />,
    },
  ].map((route) => ({
    ...route,
    errorElement: <ErrorPage />,
  })),
)

function App() {
  return (
    <ThemeProvider>
      <CssBaseline />
      <Header />
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}

export default App
