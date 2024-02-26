import { RouteObject } from "react-router-dom"
import CategoriesPage from "./components/categories/CategoriesPage"
import TransactionsPage from "./components/transactions/TransactionsPage"
import { PageWithHeader } from "./components/PageWithHeader"
import BudgetsPage from "./components/budgets/BudgetsPage"
import MonthlyPage from "./components/monthly/MonthlyPage"
// import CategoryTimePage from "./components/category-time/CategoryTimePage"

enum Routes {
  HOME = "/",
  CATEGORIES = "/categories",
  BUDGETS = "/budgets",
  MONTHLY = "/monthly",
  // CATEGORY_TIME = "/category-time",
}

interface Route extends Omit<RouteObject, "path"> {
  path: Routes
  label: string
}

export const routes: Route[] = [
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
    path: Routes.HOME,
    element: (
      <PageWithHeader>
        <TransactionsPage />
      </PageWithHeader>
    ),
    label: "Transactions",
  },
  {
    path: Routes.BUDGETS,
    element: (
      <PageWithHeader>
        <BudgetsPage />
      </PageWithHeader>
    ),
    label: "Budgets",
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
  // {
  //   path: Routes.CATEGORY_TIME,
  //   element: (
  //     <PageWithHeader>
  //       <CategoryTimePage />
  //     </PageWithHeader>
  //   ),
  //   label: "Categories/Time aggregation",
  // },
]
