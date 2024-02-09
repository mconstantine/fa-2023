import { PaginationResponse } from "../../globalDomain"
import { makeGet } from "../../network/HttpRequest"
import { Category, ListCategoriesInput } from "./domain"

export const listCategoriesRequest = makeGet("/categories/", {
  query: ListCategoriesInput,
  response: PaginationResponse(Category),
})
