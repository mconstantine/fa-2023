import * as S from "@effect/schema/Schema"
import { PaginationQuery } from "../../domain"

export const Category = S.struct({
  id: S.UUID,
  name: S.string.pipe(S.nonEmpty()),
  is_meta: S.boolean,
  keywords: S.array(S.string.pipe(S.nonEmpty())),
})

export interface Category extends S.Schema.To<typeof Category> {}

export const ListCategoriesInput = S.extend(
  PaginationQuery,
  S.struct({
    search_query: S.optional(S.string),
  }),
)

export interface ListCategoriesInput
  extends S.Schema.To<typeof ListCategoriesInput> {}

export const InsertCategoryInput = S.struct({
  name: S.string.pipe(S.nonEmpty()),
  is_meta: S.boolean,
  keywords: S.array(S.string.pipe(S.nonEmpty())),
})

export interface InsertCategoryInput
  extends S.Schema.To<typeof InsertCategoryInput> {}

export const UpdateCategoryInput = S.struct({
  name: S.optional(S.string.pipe(S.nonEmpty())),
  is_meta: S.optional(S.boolean),
  keywords: S.optional(S.array(S.string.pipe(S.nonEmpty()))),
})

export interface UpdateCategoryInput
  extends S.Schema.To<typeof UpdateCategoryInput> {}
