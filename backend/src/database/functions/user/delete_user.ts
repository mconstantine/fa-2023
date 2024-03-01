import type * as S from "@effect/schema/Schema"
import * as db from "../../db"
import { type FunctionTemplate } from "../template"
import { User } from "./domain"

export default {
  name: "delete_user",
  args: [
    {
      mode: "IN",
      type: "uuid",
      name: "target_id",
      defaultExpr: null,
    },
  ],
  returns: "jsonb",
  volatility: "VOLATILE",
  leakproof: false,
  parallel: "UNSAFE",
  cost: null,
} satisfies FunctionTemplate

export async function deleteUser(
  id: S.Schema.To<typeof S.UUID>,
): Promise<User> {
  return await db.callFunction("delete_user", User, id)
}
