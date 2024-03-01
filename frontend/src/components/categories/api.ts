import * as S from "@effect/schema/Schema"
import { PaginationResponse } from "../../globalDomain"
import {
  makeDelete,
  makeGet,
  makePatch,
  makePost,
} from "../../network/HttpRequest"
import {
  Category,
  InsertCategoryInput,
  ListCategoriesInput,
  UpdateCategoryInput,
} from "./domain"

export const listCategoriesRequest = makeGet("/categories/", {
  query: ListCategoriesInput,
  response: PaginationResponse(Category),
})

export const insertCategoryRequest = makePost("/categories/", {
  body: InsertCategoryInput,
  response: Category,
})

export const updateCategoryRequest = makePatch("/categories/:id/", {
  params: S.struct({
    id: S.UUID,
  }),
  body: UpdateCategoryInput,
  response: Category,
})

export const deleteCategoryRequest = makeDelete("/categories/:id/", {
  params: S.struct({
    id: S.UUID,
  }),
  response: Category,
})
