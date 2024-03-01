import { makeGet } from "../../network/HttpRequest"
import {
  AggregateTransactionsByTimeAndCategoryInput,
  TransactionsByTimeAndCategory,
} from "./domain"

export const aggregateTransactionsByTimeAndCategoryRequest = makeGet(
  "/transactions/by-time-and-category",
  {
    query: AggregateTransactionsByTimeAndCategoryInput,
    response: TransactionsByTimeAndCategory,
  },
)
