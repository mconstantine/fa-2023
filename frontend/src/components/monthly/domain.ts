import * as S from "@effect/schema/Schema"
import {
  AggregateTransactionsByMonthInput as ServerAggregateTransactionsByMonthInput,
  TransactionByMonth as ServerTransactionByMonth,
} from "../../../../backend/src/database/functions/transaction/domain"

export const AggregateTransactionsByMonthInput =
  ServerAggregateTransactionsByMonthInput

export type AggregateTransactionsByMonthInput =
  ServerAggregateTransactionsByMonthInput

export const TransactionByMonth = S.extend(
  S.omit<ServerTransactionByMonth, ["income", "outcome", "total"]>(
    "income",
    "outcome",
    "total",
  )(ServerTransactionByMonth),
  S.struct({
    income: S.number,
    outcome: S.number,
    total: S.number,
  }),
)
