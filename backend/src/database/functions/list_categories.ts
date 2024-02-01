import { type FunctionTemplate } from "./template"

export default {
  name: "list_categories",
  args: [
    {
      name: "pagination_query",
    },
    {
      type: "character varying",
      name: "search_query",
    },
  ],
  volatility: "STABLE",
  leakproof: true,
  parallel: "SAFE",
} satisfies FunctionTemplate
