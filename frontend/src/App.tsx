import { CssBaseline } from "@mui/material"
import { ThemeProvider } from "./contexts/ThemeContext"
import {
  RouteObject,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom"
import ErrorPage from "./ErrorPage"
import { routes } from "./routes"
import { AuthContextProvider } from "./contexts/AuthContext"

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
      <AuthContextProvider>
        <CssBaseline />
        <RouterProvider router={router} />
      </AuthContextProvider>
    </ThemeProvider>
  )
}

export default App
