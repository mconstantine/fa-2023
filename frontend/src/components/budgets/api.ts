import * as S from "@effect/schema/Schema"
import {
  makeDelete,
  makeGet,
  makePatch,
  makePost,
} from "../../network/HttpRequest"
import {
  Budget,
  BudgetWithCategory,
  InsertBudgetInput,
  ListBudgetsFilters,
  TransactionByCategory,
  UpdateBudgetInput,
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

export const deleteBudgetRequest = makeDelete("/budgets/:id/", {
  params: S.struct({
    id: S.UUID,
  }),
  response: Budget,
})

export const insertBudgetRequest = makePost("/budgets/", {
  body: InsertBudgetInput,
  response: BudgetWithCategory,
})

export const updateBudgetRequest = makePatch("/budgets/:id/", {
  params: S.struct({
    id: S.UUID,
  }),
  body: UpdateBudgetInput,
  response: BudgetWithCategory,
})
