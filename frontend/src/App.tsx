import { CssBaseline } from "@mui/material"
import { ThemeProvider } from "./contexts/ThemeContext"
import {
  RouteObject,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom"
import ErrorPage from "./ErrorPage"
import { routes } from "./routes"

const router = createBrowserRouter(
  routes.map(
    (route) =>
      ({
        ...route,
        errorElement: <ErrorPage />,
      } as RouteObject),
  ),
)

function App() {
  return (
    <ThemeProvider>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}

export default App
