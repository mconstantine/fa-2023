import * as S from "@effect/schema/Schema"
import { Category } from "../database/functions/category/domain"
import {
  InsertCategoryInput,
  insertCategory,
} from "../database/functions/category/insert_category"
import { Router } from "./Router"
import { PaginationResponse } from "../database/domain"
import {
  ListCategoriesInput,
  listCategories,
} from "../database/functions/category/list_categories"
import {
  UpdateCategoryInput,
  updateCategory,
} from "../database/functions/category/update_category"
import { deleteCategory } from "../database/functions/category/delete_category"
import { HttpError } from "./HttpError"

export const CategoryRouter = Router.get("/", {
  codecs: {
    query: ListCategoriesInput,
    response: PaginationResponse(Category),
  },
  handler: async ({ query }) => {
    return await listCategories(query)
  },
})
  .post("/", {
    codecs: {
      body: InsertCategoryInput,
      response: Category,
    },
    handler: async ({ body }) => await insertCategory(body),
  })
  .patch("/:id", {
    codecs: {
      params: S.struct({
        id: S.UUID,
      }),
      body: UpdateCategoryInput,
      response: Category,
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
      response: Category,
    },
    handler: async ({ params }) => {
      try {
        return await deleteCategory(params.id)
      } catch (e) {
        throw new HttpError(404, "Category not found")
      }
    },
  })
