import { type FunctionTemplate } from "./template"
import * as S from "@effect/schema/Schema"

export default {
  name: "update_category",
  args: [
    {
      mode: "IN",
      type: "uuid",
      name: "target_id",
      defaultExpr: null,
    },
    {
      mode: "IN",
      name: "body",
      type: "jsonb",
      defaultExpr: null,
    },
  ],
  returns: "jsonb",
  volatility: "VOLATILE",
  leakproof: false,
  parallel: "UNSAFE",
  cost: null,
} satisfies FunctionTemplate

const UpdateCategoryInput = S.struct({
  name: S.string.pipe(S.nonEmpty()),
  is_meta: S.boolean,
  keywords: S.array(S.string.pipe(S.nonEmpty())),
})

export interface UpdateCategoryInput
  extends S.Schema.To<typeof UpdateCategoryInput> {}
