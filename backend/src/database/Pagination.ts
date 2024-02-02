import * as S from "@effect/schema/Schema"

const PaginationQueryDirection = S.literal("forward", "backward")

const PaginationQuery = S.struct({
  direction: PaginationQueryDirection,
  count: S.number.pipe(S.int()).pipe(S.greaterThan(0)),
  target: S.optional(S.UUID),
})

export interface PaginationQuery extends S.Schema.To<typeof PaginationQuery> {}

const CursorBrand = Symbol.for("Cursor")
const Cursor = S.UUID.pipe(S.brand(CursorBrand))
type Cursor = S.Schema.To<typeof Cursor>

interface EdgeFrom<T> {
  readonly cursor: string
  readonly node: T
}

interface EdgeTo<T> {
  readonly cursor: Cursor
  readonly node: T
}

const edge = <R, From, To>(
  schema: S.Schema<R, From, To>,
): S.Schema<R, EdgeFrom<From>, EdgeTo<To>> => {
  return S.struct({
    cursor: Cursor,
    node: schema,
  })
}

const PageInfo = S.struct({
  total_count: S.number.pipe(S.int()).pipe(S.greaterThanOrEqualTo(0)),
  start_cursor: S.optionFromNullable(Cursor),
  end_cursor: S.optionFromNullable(Cursor),
  has_previous_page: S.boolean,
  has_next_page: S.boolean,
})

type ReadonlyArray<T> = readonly T[]

interface PaginationResponseFrom<T> {
  readonly page_info: S.Schema.From<typeof PageInfo>
  readonly edges: ReadonlyArray<EdgeFrom<T>>
}

export interface PaginationResponse<T> {
  readonly page_info: S.Schema.To<typeof PageInfo>
  readonly edges: ReadonlyArray<EdgeTo<T>>
}

export const PaginationResponse = <R, From, To>(
  schema: S.Schema<R, From, To>,
): S.Schema<R, PaginationResponseFrom<From>, PaginationResponse<To>> => {
  return S.struct({
    page_info: PageInfo,
    edges: S.array(edge(schema)),
  })
}
