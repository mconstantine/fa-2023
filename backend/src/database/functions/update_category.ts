import { type FunctionTemplate } from "./template"
import * as S from "@effect/schema/Schema"

export default {
  name: "update_category",
  args: [
    {
      type: "uuid",
      name: "target_id",
    },
    {
      name: "body",
    },
  ],
  volatility: "VOLATILE",
  leakproof: false,
  parallel: "UNSAFE",
} satisfies FunctionTemplate

const UpdateCategoryInput = S.struct({
  name: S.string.pipe(S.nonEmpty()),
  is_meta: S.boolean,
  keywords: S.array(S.string.pipe(S.nonEmpty())),
})

export interface UpdateCategoryInput
  extends S.Schema.To<typeof UpdateCategoryInput> {}
