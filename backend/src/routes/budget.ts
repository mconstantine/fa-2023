import * as S from "@effect/schema/Schema"
import { listBudgets } from "../database/functions/budget/list_budgets"
import { Router } from "./Router"
import { insertBudget } from "../database/functions/budget/insert_budget"
import { insertBudgets } from "../database/functions/budget/insert_budgets"
import { HttpError } from "./HttpError"
import { updateBudget } from "../database/functions/budget/update_budget"
import { updateBudgets } from "../database/functions/budget/update_budgets"
import { deleteBudget } from "../database/functions/budget/delete_budget"
import {
  InsertBudgetInput,
  UpdateBudgetInput,
  UpdateBudgetsInput,
} from "../database/functions/budget/domain"

export const budgetRouter = Router.get("/", {
  codecs: {
    query: S.struct({
      year: S.NumberFromString.pipe(S.int()),
    }),
  },
  handler: async ({ query }) => await listBudgets(query),
})
  .post("/", {
    codecs: {
      body: InsertBudgetInput,
    },
    handler: async ({ body }) => {
      try {
        return await insertBudget(body)
      } catch (e) {
        throw new HttpError(
          409,
          "Only one budget per category per year can exist",
        )
      }
    },
  })
  .post("/bulk", {
    codecs: {
      body: S.array(InsertBudgetInput),
    },
    handler: async ({ body }) => {
      try {
        return await insertBudgets(body)
      } catch (e) {
        throw new HttpError(
          409,
          "Only one budget per category per year can exist",
        )
      }
    },
  })
  .patch("/bulk", {
    codecs: {
      body: UpdateBudgetsInput,
    },
    handler: async ({ body }) => await updateBudgets(body),
  })
  .patch("/:id", {
    codecs: {
      params: S.struct({
        id: S.UUID,
      }),
      body: UpdateBudgetInput,
    },
    handler: async ({ params, body }) => await updateBudget(params.id, body),
  })
  .delete("/:id", {
    codecs: {
      params: S.struct({
        id: S.UUID,
      }),
    },
    handler: async ({ params }) => await deleteBudget(params.id),
  })
  .toExpressRouter()
