import * as db from "./db"

export async function initDatabase(): Promise<void> {
  // TODO: get the files, execute init, call the functions
  const result = await db.query<{ now: Date }>("select now()")
  console.log(result.rows[0]?.now)
}
