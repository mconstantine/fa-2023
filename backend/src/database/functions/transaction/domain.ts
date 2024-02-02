import * as S from "@effect/schema/Schema"

export const Transaction = S.struct({
  id: S.UUID,
  description: S.string.pipe(S.nonEmpty()),
  value: S.number,
  date: S.Date,
})

export interface Transaction extends S.Schema.To<typeof Transaction> {}
