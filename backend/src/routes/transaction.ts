import * as db from "../database/db"
import * as S from "@effect/schema/Schema"
import { insertTransaction } from "../database/functions/transaction/insert_transaction"
import {
  InsertTransactionsInput,
  insertTransactions,
} from "../database/functions/transaction/insert_transactions"
import { listTransactions } from "../database/functions/transaction/list_transactions"
import { updateTransaction } from "../database/functions/transaction/update_transaction"
import { Router } from "./Router"
import { updateTransactions } from "../database/functions/transaction/update_transactions"
import { deleteTransaction } from "../database/functions/transaction/delete_transaction"
import { HttpError } from "./HttpError"
import {
  AggregateTransactionsByCategoryInput,
  AggregateTransactionsByMonthInput,
  AggregateTransactionsByTimeAndCategoryInput,
  InsertTransactionInput,
  ListTransactionsInput,
  UpdateTransactionInput,
  UpdateTransactionsInput,
} from "../database/functions/transaction/domain"
import multer from "multer"
import { type Request, type Response } from "express"
import { handleError } from "./handleError"
import { BankAdapter } from "../adapters/BankAdapter"
import { Effect, Either, Exit, Option, pipe } from "effect"
import { ImportErrorType } from "../adapters/Adapter"
import { constVoid } from "effect/Function"
import { aggregateTransactionsByCategory } from "../database/functions/transaction/aggregate_transactions_by_category"
import { aggregateTransactionsByMonth } from "../database/functions/transaction/aggregate_transactions_by_month"
import { aggregateTransactionsByTimeAndCategory } from "../database/functions/transaction/aggregate_transactions_by_time_and_category"
import { authMiddleware } from "../middlewares/auth"
import { User } from "../database/functions/user/domain"

export const transactionRouter = Router.withMiddleware(authMiddleware)
  .get("/", {
    codecs: {
      query: ListTransactionsInput,
    },
    handler: async ({ query, locals }) =>
      await listTransactions(locals.user, query),
  })
  .get("/by-category", {
    codecs: {
      query: AggregateTransactionsByCategoryInput,
    },
    handler: async ({ query, locals }) =>
      await aggregateTransactionsByCategory(locals.user, query),
  })
  .get("/by-month", {
    codecs: {
      query: AggregateTransactionsByMonthInput,
    },
    handler: async ({ query, locals }) =>
      await aggregateTransactionsByMonth(locals.user, query),
  })
  .get("/by-time-and-category", {
    codecs: {
      query: AggregateTransactionsByTimeAndCategoryInput,
    },
    handler: async ({ query, locals }) =>
      await aggregateTransactionsByTimeAndCategory(locals.user, query),
  })
  .post("/", {
    codecs: {
      body: InsertTransactionInput,
    },
    handler: async ({ body, locals }) =>
      await insertTransaction(locals.user, body),
  })
  .post("/bulk", {
    codecs: {
      body: InsertTransactionsInput,
    },
    handler: async ({ body, locals }) =>
      await insertTransactions(locals.user, body),
  })
  .patch("/bulk", {
    codecs: {
      body: UpdateTransactionsInput,
    },
    handler: async ({ body, locals }) =>
      await updateTransactions(locals.user, body),
  })
  .tap((router) =>
    router.patch(
      "/import",
      multer({
        storage: multer.memoryStorage(),
        limits: {
          files: 1,
          // 1MB
          fileSize: 1048576,
        },
      }).fields([
        {
          name: "bank",
          maxCount: 1,
        },
      ]),
      (req, res) => {
        handleTransactionsImport(req, res)
      },
    ),
  )
  .patch("/:id", {
    codecs: {
      params: S.struct({ id: S.UUID }),
      body: UpdateTransactionInput,
    },
    handler: async ({ params, body, locals }) => {
      try {
        return await updateTransaction(locals.user, params.id, body)
      } catch (e) {
        throw new HttpError(404, "Transaction not found")
      }
    },
  })
  .delete("/:id", {
    codecs: {
      params: S.struct({ id: S.UUID }),
    },
    handler: async ({ params, locals }) => {
      try {
        return await deleteTransaction(locals.user, params.id)
      } catch (e) {
        throw new HttpError(404, "Transaction not found")
      }
    },
  })
  .toExpressRouter()

function handleTransactionsImport(req: Request, res: Response): void {
  if ("user" in req) {
    pipe(
      req.user,
      S.decodeUnknownOption(User),
      Option.match({
        onNone: () => {
          handleError(new HttpError(401, "Unauthorized"), res)
        },
        onSome: (user) => {
          if (typeof req.files === "undefined" || Array.isArray(req.files)) {
            handleError(new HttpError(400, "Missing files"), res)
            return
          }

          if (
            !("bank" in req.files) ||
            typeof req.files["bank"][0] === "undefined"
          ) {
            handleError(new HttpError(400, "Missing bank file"), res)
            return
          }

          const bankFile = req.files["bank"][0]
          const bankFileContent = bankFile.buffer.toString("utf-8")
          const rows = bankFileContent.split("\n").slice(1)

          if (rows.length === 0) {
            handleError(
              new HttpError(400, "No transactions found in file"),
              res,
            )
            return
          }

          pipe(
            rows.map((row) => BankAdapter.fromString(row)),
            Either.all,
            Either.mapLeft((error) => {
              switch (error.type) {
                case ImportErrorType.INVALID_DATE:
                  return new HttpError(
                    400,
                    `Invalid date in file: ${error.subject}`,
                  )
                case ImportErrorType.INVALID_ROW:
                  return new HttpError(
                    400,
                    `Invalid row in file: ${error.subject}`,
                  )
                case ImportErrorType.NO_VALUE:
                  return new HttpError(
                    400,
                    `Found row with no transaction value in file: ${error.subject}`,
                  )
              }
            }),
            Either.match({
              onLeft: (error) => {
                handleError(error, res)
              },
              onRight: (body) => {
                const timestamps = body.map((t) => t.date.getTime())
                const minDate = new Date(Math.min(...timestamps))
                const maxDate = new Date(Math.max(...timestamps))

                const result = pipe(
                  Effect.tryPromise({
                    try: async () => {
                      return await db.query(
                        "delete from transaction where date >= $1 and date <= $2",
                        [
                          minDate.toISOString().slice(0, 10),
                          maxDate.toISOString().slice(0, 10),
                        ],
                      )
                    },
                    catch: () =>
                      new HttpError(
                        500,
                        "Unable to cleanup transactions before import",
                      ),
                  }),
                  Effect.flatMap(() =>
                    Effect.tryPromise({
                      try: async () => {
                        return await insertTransactions(
                          user,
                          body.map((t) => ({ ...t, categories_ids: [] })),
                        )
                      },
                      catch: (error) => {
                        console.log(error)
                        return new HttpError(
                          500,
                          "Unable to import the transactions",
                        )
                      },
                    }),
                  ),
                )

                Effect.runPromiseExit(result).then(
                  Exit.match({
                    onSuccess: (response) => {
                      res.json(response)
                    },
                    onFailure: (cause) => {
                      if (cause._tag === "Fail") {
                        return cause.error
                      } else {
                        return new HttpError(500, "Process failed", { cause })
                      }
                    },
                  }),
                  constVoid,
                )
              },
            }),
          )
        },
      }),
    )
  } else {
    handleError(new HttpError(401, "Unauthorized"), res)
  }
}
