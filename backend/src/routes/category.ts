import * as S from "@effect/schema/Schema"
import { insertCategory } from "../database/functions/category/insert_category"
import { Router } from "./Router"
import { listCategories } from "../database/functions/category/list_categories"
import { updateCategory } from "../database/functions/category/update_category"
import { deleteCategory } from "../database/functions/category/delete_category"
import { HttpError } from "./HttpError"
import {
  InsertCategoryInput,
  ListCategoriesInput,
  UpdateCategoryInput,
} from "../database/functions/category/domain"
import { authMiddleware } from "../middlewares/auth"

export const categoryRouter = Router.withMiddleware(authMiddleware)
  .get("/", {
    codecs: {
      query: ListCategoriesInput,
    },
    handler: async ({ query, locals }) => {
      return await listCategories(locals.user, query)
    },
  })
  .post("/", {
    codecs: {
      body: InsertCategoryInput,
    },
    handler: async ({ body, locals }) =>
      await insertCategory(locals.user, body),
  })
  .patch("/:id", {
    codecs: {
      params: S.struct({
        id: S.UUID,
      }),
      body: UpdateCategoryInput,
    },
    handler: async ({ params, body, locals }) => {
      try {
        return await updateCategory(locals.user, params.id, body)
      } catch (e) {
        throw new HttpError(404, "Category not found")
      }
    },
  })
  .delete("/:id", {
    codecs: {
      params: S.struct({
        id: S.UUID,
      }),
    },
    handler: async ({ params, locals }) => {
      try {
        return await deleteCategory(locals.user, params.id)
      } catch (e) {
        throw new HttpError(404, "Category not found")
      }
    },
  })
  .toExpressRouter()
