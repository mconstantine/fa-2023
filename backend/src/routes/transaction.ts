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
  InsertTransactionInput,
  ListTransactionsInput,
  UpdateTransactionInput,
  UpdateTransactionsInput,
} from "../database/functions/transaction/domain"
import multer from "multer"
import { type Request, type Response } from "express"
import { handleError } from "./handleError"
import { BankAdapter } from "../adapters/BankAdapter"
import { Cause, Effect, Either, Exit, pipe } from "effect"
import { ImportErrorType } from "../adapters/Adapter"
import { constVoid, flow, identity } from "effect/Function"
import { aggregateTransactionsByCategory } from "../database/functions/transaction/aggregate_transactions_by_category"

export const transactionRouter = Router.get("/", {
  codecs: {
    query: ListTransactionsInput,
  },
  handler: async ({ query }) => await listTransactions(query),
})
  .get("/by-category", {
    codecs: {
      query: AggregateTransactionsByCategoryInput,
    },
    handler: async ({ query }) => await aggregateTransactionsByCategory(query),
  })
  .post("/", {
    codecs: {
      body: InsertTransactionInput,
    },
    handler: async ({ body }) => await insertTransaction(body),
  })
  .post("/bulk", {
    codecs: {
      body: InsertTransactionsInput,
    },
    handler: async ({ body }) => await insertTransactions(body),
  })
  .patch("/bulk", {
    codecs: {
      body: UpdateTransactionsInput,
    },
    handler: async ({ body }) => await updateTransactions(body),
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
    handler: async ({ params, body }) => {
      try {
        return await updateTransaction(params.id, body)
      } catch (e) {
        throw new HttpError(404, "Transaction not found")
      }
    },
  })
  .delete("/:id", {
    codecs: {
      params: S.struct({ id: S.UUID }),
    },
    handler: async ({ params }) => {
      try {
        return await deleteTransaction(params.id)
      } catch (e) {
        throw new HttpError(404, "Transaction not found")
      }
    },
  })
  .toExpressRouter()

function handleTransactionsImport(req: Request, res: Response): void {
  if (typeof req.files === "undefined" || Array.isArray(req.files)) {
    handleError(new HttpError(400, "Missing files"), res)
    return
  }

  if (!("bank" in req.files) || typeof req.files["bank"][0] === "undefined") {
    handleError(new HttpError(400, "Missing bank file"), res)
    return
  }

  const bankFile = req.files["bank"][0]
  const bankFileContent = bankFile.buffer.toString("utf-8")
  const rows = bankFileContent.split("\n").slice(1)

  if (rows.length === 0) {
    handleError(new HttpError(400, "No transactions found in file"), res)
    return
  }

  pipe(
    rows.map((row) => BankAdapter.fromString(row)),
    Either.all,
    Either.mapLeft((error) => {
      switch (error.type) {
        case ImportErrorType.INVALID_DATE:
          return new HttpError(400, `Invalid date in file: ${error.subject}`)
        case ImportErrorType.INVALID_ROW:
          return new HttpError(400, `Invalid row in file: ${error.subject}`)
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
                  body.map((t) => ({ ...t, categories_ids: [] })),
                )
              },
              catch: (error) => {
                console.log(error)
                return new HttpError(500, "Unable to import the transactions")
              },
            }),
          ),
        )

        Effect.runPromiseExit(result).then(
          Exit.match({
            onSuccess: (response) => {
              res.json(response)
            },
            onFailure: flow(
              Cause.match({
                onDie: () => new HttpError(500, "Process is dead"),
                onEmpty: new HttpError(
                  500,
                  "Process terminated with empty result",
                ),
                onFail: identity,
                onInterrupt: () =>
                  new HttpError(500, "Process was interrupted"),
                onParallel: () =>
                  new HttpError(500, "Parallel processes failed"),
                onSequential: () =>
                  new HttpError(500, "Sequential processes failed"),
              }),
              (error): void => {
                handleError(error, res)
              },
            ),
          }),
          constVoid,
        )
      },
    }),
  )
}
