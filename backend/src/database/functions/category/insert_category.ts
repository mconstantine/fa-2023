import { type FunctionTemplate } from "../template"
import { Category, type InsertCategoryInput } from "./domain"
import * as db from "../../db"
import { type User } from "../user/domain"

export default {
  name: "insert_category",
  args: [
    {
      mode: "IN",
      type: "uuid",
      name: "owner_id",
      defaultExpr: null,
    },
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

export async function insertCategory(
  user: User,
  body: InsertCategoryInput,
): Promise<Category> {
  return await db.callFunction("insert_category", Category, user.id, body)
}
