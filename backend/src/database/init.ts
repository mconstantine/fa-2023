import * as S from "@effect/schema/Schema"
import * as db from "./db"
import fs from "fs"
import path from "path"
import { FunctionTemplate, template } from "./functions/template"
import { glob } from "glob"
import { pipe } from "effect"

const upMigrationPattern = /^\d+_up/

const Migration = S.struct({
  name: S.string.pipe(S.nonEmpty()),
})

export async function initDatabase(): Promise<void> {
  const initQuery = fs.readFileSync(path.join(__dirname, "init.sql"), "utf8")

  await db.query(initQuery)

  await db.query(`
    create table if not exists migration
    (
        name character varying(255) not null,
        constraint migration_pkey primary key (name)
    );
  `)

  const migrations = await db.getMany(Migration, "select * from migration")
  const migrationNames = migrations.map((m) => m.name)

  const migrationFiles = fs
    .readdirSync(path.join(__dirname, "migrations"))
    .filter((file) => path.extname(file) === ".sql")
    .filter((file) => upMigrationPattern.test(file))

  for (const file of migrationFiles) {
    const migrationName = path.basename(file, ".sql")

    if (!migrationNames.includes(migrationName)) {
      const sql = fs.readFileSync(
        path.join(__dirname, "migrations", file),
        "utf8",
      )

      await db.transact(async (client) => {
        await client.query(sql)

        await client.query("insert into migration (name) values ($1)", [
          migrationName,
        ])
      })
    }
  }

  const functionFiles = await glob(path.join(__dirname, "functions/**/*.ts"), {
    ignore: {
      ignored: (path) =>
        typeof path.parent === "undefined" ||
        path.parent.isNamed("functions") ||
        path.isNamed("domain.ts"),
    },
  })

  await Promise.all(
    functionFiles.map(async (file) => {
      const ts = await import(file)
      const filePath = path.dirname(file)
      const fileName = path.basename(file, ".ts")

      const f = pipe(ts.default, S.decodeUnknownSync(FunctionTemplate))

      const sql = fs.readFileSync(
        path.join(filePath, `${fileName}.sql`),
        "utf8",
      )

      const query = template({ ...f, body: sql })
      return await db.query(query)
    }),
  )
}
