import * as S from "@effect/schema/Schema"
import { makeGet } from "../../network/HttpRequest"
import {
  BudgetWithCategory,
  ListBudgetsFilters,
  TransactionByCategory,
} from "./domain"

export const listBudgetsRequest = makeGet("/budgets/", {
  query: ListBudgetsFilters,
  response: S.array(BudgetWithCategory),
})

export const aggregateTransactionsByCategoryRequest = makeGet(
  "/transactions/by-category",
  {
    query: ListBudgetsFilters,
    response: S.array(TransactionByCategory),
  },
)
