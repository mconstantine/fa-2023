import * as S from "@effect/schema/Schema"
import {
  InsertTransactionInput,
  insertTransaction,
} from "../database/functions/transaction/insert_transaction"
import {
  InsertTransactionsInput,
  insertTransactions,
} from "../database/functions/transaction/insert_transactions"
import {
  ListTransactionsInput,
  listTransactions,
} from "../database/functions/transaction/list_transactions"
import {
  UpdateTransactionInput,
  updateTransaction,
} from "../database/functions/transaction/update_transaction"
import { Router } from "./Router"
import {
  UpdateTransactionsInput,
  updateTransactions,
} from "../database/functions/transaction/update_transactions"
import { deleteTransaction } from "../database/functions/transaction/delete_transaction"

export const TransactionRouter = Router.get("/", {
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
  .patch("/:id", {
    codecs: {
      params: S.struct({ id: S.UUID }),
      body: UpdateTransactionInput,
    },
    handler: async ({ params, body }) =>
      await updateTransaction(params.id, body),
  })
  .patch("/bulk", {
    codecs: {
      body: UpdateTransactionsInput,
    },
    handler: async ({ body }) => await updateTransactions(body),
  })
  .delete("/:id", {
    codecs: {
      params: S.struct({ id: S.UUID }),
    },
    handler: async ({ params }) => await deleteTransaction(params.id),
  })
