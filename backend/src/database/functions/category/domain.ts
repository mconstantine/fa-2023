import * as S from "@effect/schema/Schema"
import { BooleanFromString, PaginationQuery } from "../../domain"

const BaseCategory = S.struct({
  id: S.UUID,
  name: S.string.pipe(S.nonEmpty()),
  keywords: S.array(S.string.pipe(S.nonEmpty())),
})

const NonMetaCategory = S.extend(
  BaseCategory,
  S.struct({
    is_meta: S.literal(false),
    is_projectable: S.boolean,
  }),
)

const MetaCategory = S.extend(
  BaseCategory,
  S.struct({
    is_meta: S.literal(true),
    is_projectable: S.literal(false),
  }),
)

export const Category = S.union(NonMetaCategory, MetaCategory)

export type Category = S.Schema.To<typeof Category>

export const ListCategoriesInput = S.extend(
  PaginationQuery,
  S.struct({
    search_query: S.optional(S.string),
    is_meta: S.optional(BooleanFromString),
  }),
)

export interface ListCategoriesInput
  extends S.Schema.To<typeof ListCategoriesInput> {}

const BaseInsertCategoryInput = S.struct({
  name: S.string.pipe(S.nonEmpty()),
  keywords: S.array(S.string.pipe(S.nonEmpty())),
})

const InsertNonMetaCategoryInput = S.extend(
  BaseInsertCategoryInput,
  S.struct({
    is_meta: S.literal(false),
    is_projectable: S.boolean,
  }),
)

const InsertMetaCategoryInput = S.extend(
  BaseInsertCategoryInput,
  S.struct({
    is_meta: S.literal(true),
    is_projectable: S.literal(false),
  }),
)

export const InsertCategoryInput = S.union(
  InsertNonMetaCategoryInput,
  InsertMetaCategoryInput,
)

export type InsertCategoryInput = S.Schema.To<typeof InsertCategoryInput>

const BaseUpdateCategoryInput = S.struct({
  name: S.optional(S.string.pipe(S.nonEmpty())),
  keywords: S.optional(S.array(S.string.pipe(S.nonEmpty()))),
})

const UpdateNonMetaCategoryInput = S.extend(
  BaseUpdateCategoryInput,
  S.struct({
    is_meta: S.optional(S.literal(false)),
    is_projectable: S.optional(S.boolean),
  }),
)

const UpdateMetaCategoryInput = S.extend(
  BaseUpdateCategoryInput,
  S.struct({
    is_meta: S.optional(S.literal(true)),
    is_projectable: S.optional(S.literal(false)),
  }),
)

export const UpdateCategoryInput = S.union(
  UpdateNonMetaCategoryInput,
  UpdateMetaCategoryInput,
)

export type UpdateCategoryInput = S.Schema.To<typeof UpdateCategoryInput>
