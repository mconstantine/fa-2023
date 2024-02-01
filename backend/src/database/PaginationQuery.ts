import * as S from "@effect/schema/Schema"

const PaginationQueryDirection = S.union(
  S.literal("forward"),
  S.literal("backward"),
)

const PaginationQuery = S.struct({
  direction: PaginationQueryDirection,
  count: S.number.pipe(S.int()).pipe(S.greaterThan(0)),
  target: S.UUID,
})

export interface PaginationQuery extends S.Schema.To<typeof PaginationQuery> {}
