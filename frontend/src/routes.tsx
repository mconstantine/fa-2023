import { RouteObject } from "react-router-dom"
import CategoriesPage from "./components/categories/CategoriesPage"
import TransactionsPage from "./components/transactions/TransactionsPage"
import PredictionsPage from "./components/predictions/PredictionsPage"
import { PageWithHeader } from "./components/PageWithHeader"
import MonthlyPage from "./components/monthly/MonthlyPage"
import CategoryTimePage from "./components/category-time/CategoryTimePage"

enum Routes {
  HOME = "/",
  CATEGORIES = "/categories",
  PREDICTIONS = "/predictions",
  MONTHLY = "/monthly",
  CATEGORY_TIME = "/category-time",
}

interface Route extends Omit<RouteObject, "path"> {
  path: Routes
  label: string
}

export const routes: Route[] = [
  {
    path: Routes.HOME,
    element: (
      <PageWithHeader>
        <TransactionsPage />
      </PageWithHeader>
    ),
    label: "Transactions",
  },
  {
    path: Routes.CATEGORIES,
    element: (
      <PageWithHeader>
        <CategoriesPage />
      </PageWithHeader>
    ),
    label: "Categories",
  },
  {
    path: Routes.PREDICTIONS,
    element: (
      <PageWithHeader>
        <PredictionsPage />
      </PageWithHeader>
    ),
    label: "Predictions",
  },
  {
    path: Routes.MONTHLY,
    element: (
      <PageWithHeader>
        <MonthlyPage />
      </PageWithHeader>
    ),
    label: "Monthly aggregation",
  },
  {
    path: Routes.CATEGORY_TIME,
    element: (
      <PageWithHeader>
        <CategoryTimePage />
      </PageWithHeader>
    ),
    label: "Categories/Time aggregation",
  },
]
