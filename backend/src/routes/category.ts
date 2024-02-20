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

export const categoryRouter = Router.get("/", {
  codecs: {
    query: ListCategoriesInput,
  },
  handler: async ({ query }) => {
    return await listCategories(query)
  },
})
  .post("/", {
    codecs: {
      body: InsertCategoryInput,
    },
    handler: async ({ body }) => await insertCategory(body),
  })
  .patch("/:id", {
    codecs: {
      params: S.struct({
        id: S.UUID,
      }),
      body: UpdateCategoryInput,
    },
    handler: async ({ params, body }) => {
      try {
        return await updateCategory(params.id, body)
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
    handler: async ({ params }) => {
      try {
        return await deleteCategory(params.id)
      } catch (e) {
        throw new HttpError(404, "Category not found")
      }
    },
  })
  .toExpressRouter()
