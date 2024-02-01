import { type FunctionTemplate } from "./template"

export default {
  name: "delete_category",
  args: [
    {
      type: "uuid",
      name: "target_id",
    },
  ],
  volatility: "VOLATILE",
  leakproof: false,
  parallel: "UNSAFE",
} satisfies FunctionTemplate
