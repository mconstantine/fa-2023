import * as S from "@effect/schema/Schema"

const PaginationQueryDirection = S.literal("forward", "backward")

export const PaginationQuery = S.struct({
  direction: PaginationQueryDirection,
  count: S.NumberFromString.pipe(S.int()).pipe(S.greaterThan(0)),
  target: S.optional(S.UUID),
})

export interface PaginationQuery extends S.Schema.To<typeof PaginationQuery> {}

interface EdgeFrom<T> {
  readonly cursor: string
  readonly node: T
}

interface EdgeTo<T> {
  readonly cursor: S.Schema.To<typeof S.UUID>
  readonly node: T
}

const edge = <To, From>(
  schema: S.Schema<To, From>,
): S.Schema<EdgeTo<To>, EdgeFrom<From>> => {
  return S.struct({
    cursor: S.UUID,
    node: schema,
  })
}

const PageInfo = S.struct({
  total_count: S.number.pipe(S.int()).pipe(S.greaterThanOrEqualTo(0)),
  start_cursor: S.nullable(S.UUID),
  end_cursor: S.nullable(S.UUID),
  has_previous_page: S.boolean,
  has_next_page: S.boolean,
})

type ReadonlyArray<T> = readonly T[]

interface PaginationResponseFrom<T> {
  readonly page_info: S.Schema.From<typeof PageInfo>
  readonly edges: ReadonlyArray<EdgeFrom<T>>
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type PaginationResponse<T> = {
  readonly page_info: S.Schema.To<typeof PageInfo>
  readonly edges: ReadonlyArray<EdgeTo<T>>
}

export const PaginationResponse = <To, From>(
  schema: S.Schema<To, From>,
): S.Schema<PaginationResponse<To>, PaginationResponseFrom<From>> => {
  return S.struct({
    page_info: PageInfo,
    edges: S.array(edge(schema)),
  })
}

export const CurrencyFromValue = S.number.pipe(
  S.transform(
    S.number,
    (n) => parseFloat((n / 100).toFixed(2)),
    (n) => Math.floor(n * 100),
  ),
)

export type CurrencyFromValue = S.Schema.To<typeof CurrencyFromValue>

export const ValueFromCurrency = S.number.pipe(
  S.transform(
    S.number,
    (n) => Math.floor(n * 100),
    (n) => parseFloat((n / 100).toFixed(2)),
  ),
)

export type ValueFromCurrency = S.Schema.To<typeof ValueFromCurrency>

export const BooleanFromString = S.literal("false", "true").pipe(
  S.transform(
    S.boolean,
    (fromA) => {
      switch (fromA) {
        case "true":
          return true
        case "false":
          return false
      }
    },
    (toI) => (toI ? "true" : "false"),
  ),
)
