import { type FunctionTemplate } from "../template"
import type * as S from "@effect/schema/Schema"
import * as db from "../../db"
import { User, type UpdateUserInput } from "./domain"

export default {
  name: "update_user",
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

export async function updateUser(
  id: S.Schema.To<typeof S.UUID>,
  body: UpdateUserInput,
): Promise<User> {
  return await db.callFunction("update_user", User, id, body)
}
