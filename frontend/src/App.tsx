import { CssBaseline } from "@mui/material"
import Header from "./components/Header"
import { ThemeProvider } from "./contexts/ThemeContext"
import CategoriesPage from "./components/categories/CategoriesPage"
import { RouterProvider, createBrowserRouter } from "react-router-dom"
import ErrorPage from "./ErrorPage"
import TransactionsPage from "./components/transactions/TransactionsPage"
import { PropsWithChildren } from "react"

function PageWithHeader(props: PropsWithChildren) {
  return (
    <>
      <Header />
      {props.children}
    </>
  )
}

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: (
        <PageWithHeader>
          <TransactionsPage />
        </PageWithHeader>
      ),
    },
    {
      path: "/categories",
      element: (
        <PageWithHeader>
          <CategoriesPage />
        </PageWithHeader>
      ),
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
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}

export default App
