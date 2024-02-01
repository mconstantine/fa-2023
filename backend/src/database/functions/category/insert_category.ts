import * as S from "@effect/schema/Schema"
import { type FunctionTemplate } from "../template"

export default {
  name: "insert_category",
  args: [
    {
      mode: "IN",
      type: "jsonb",
      name: "body",
      defaultExpr: null,
    },
  ],
  returns: "jsonb",
  volatility: "VOLATILE",
  leakproof: false,
  parallel: "UNSAFE",
  cost: null,
} satisfies FunctionTemplate

const InsertCategoryInput = S.struct({
  name: S.string.pipe(S.nonEmpty()),
  is_meta: S.boolean,
  keywords: S.array(S.string.pipe(S.nonEmpty())),
})

export interface InsertCategoryInput
  extends S.Schema.To<typeof InsertCategoryInput> {}

/*
TODO:
- create category codec
- create insertCategory function
- test insertCategory function
*/
