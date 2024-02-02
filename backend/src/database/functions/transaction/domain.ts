import * as S from "@effect/schema/Schema"

export const Transaction = S.struct({
  id: S.UUID,
  description: S.string.pipe(S.nonEmpty()),
  value: S.number.pipe(
    S.transform(
      S.number,
      (n) => parseFloat((n / 100).toFixed(2)),
      (n) => Math.floor(n * 100),
    ),
  ),
  date: S.Date,
})

export interface Transaction extends S.Schema.To<typeof Transaction> {}
