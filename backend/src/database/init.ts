import * as db from "./db"
import fs from "fs"
import path from "path"
import * as functions from "./functions"
import { template } from "./functions/template"

export async function initDatabase(): Promise<void> {
  const initQuery = fs.readFileSync(path.join(__dirname, "./init.sql"), "utf8")

  await db.query(initQuery)

  await Promise.all(
    Object.entries(functions).map(async ([name, module]) => {
      const f = module.default

      const sql = fs.readFileSync(
        path.join(__dirname, "functions", `${name}.sql`),
        "utf8",
      )

      const query = template({ ...f, body: sql })

      return await db.query(query)
    }),
  )
}
