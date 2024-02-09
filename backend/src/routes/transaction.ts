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
  InsertTransactionInput,
  ListTransactionsInput,
  UpdateTransactionInput,
  UpdateTransactionsInput,
} from "../database/functions/transaction/domain"

export const transactionRouter = Router.get("/", {
  codecs: {
    query: ListTransactionsInput,
  },
  handler: async ({ query }) => await listTransactions(query),
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
