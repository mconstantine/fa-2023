import * as S from "@effect/schema/Schema"

export const Category = S.struct({
  id: S.UUID,
  name: S.string.pipe(S.nonEmpty()),
  is_meta: S.boolean,
  keywords: S.array(S.string.pipe(S.nonEmpty())),
})

export interface Category extends S.Schema.To<typeof Category> {}
