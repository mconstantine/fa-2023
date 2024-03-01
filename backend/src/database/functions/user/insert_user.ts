import { type FunctionTemplate } from "../template"
import * as db from "../../db"
import { type InsertUserInput, User } from "./domain"

export default {
  name: "insert_user",
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

export async function insertUser(body: InsertUserInput): Promise<User> {
  return await db.callFunction("insert_user", User, body)
}
