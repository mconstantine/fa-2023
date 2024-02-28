import * as db from "../../db"
import * as S from "@effect/schema/Schema"
import { type FunctionTemplate } from "../template"
import { type LoginUserInput, User } from "./domain"

export default {
  name: "login_user",
  args: [
    {
      mode: "IN",
      type: "character varying",
      name: "target_email",
      defaultExpr: null,
    },
    {
      mode: "IN",
      type: "character varying",
      name: "target_password",
      defaultExpr: null,
    },
  ],
  returns: "jsonb",
  volatility: "STABLE",
  leakproof: true,
  parallel: "SAFE",
  cost: null,
} satisfies FunctionTemplate

export async function loginUser(input: LoginUserInput): Promise<User | null> {
  return await db.callFunction(
    "login_user",
    S.nullable(User),
    input.email,
    input.password,
  )
}
