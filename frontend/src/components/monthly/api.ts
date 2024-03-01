import * as S from "@effect/schema/Schema"
import { makeGet } from "../../network/HttpRequest"
import { AggregateTransactionsByMonthInput, TransactionByMonth } from "./domain"

export const aggregateTransactionsByMonthRequest = makeGet(
  "/transactions/by-month/",
  {
    query: AggregateTransactionsByMonthInput,
    response: S.array(TransactionByMonth),
  },
)
