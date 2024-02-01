import { type FunctionTemplate } from "./template"
import * as S from "@effect/schema/Schema"

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
