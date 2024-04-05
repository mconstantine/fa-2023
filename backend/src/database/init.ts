import * as S from "@effect/schema/Schema"
import * as db from "./db"
import fs from "fs"
import path from "path"
import { FunctionTemplate, template } from "./functions/template"
import { glob } from "glob"
import { Either, pipe } from "effect"
import { env } from "../env"

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

  if (Either.isLeft(migrations)) {
    throw migrations.left
  }

  const migrationNames = migrations.right.map((m) => m.name)

  const migrationFiles = fs
    .readdirSync(path.join(__dirname, "sql/migrations"))
    .filter((file) => path.extname(file) === ".sql")
    .filter((file) => upMigrationPattern.test(file))

  for (const file of migrationFiles) {
    const migrationName = path.basename(file, ".sql")

    if (!migrationNames.includes(migrationName)) {
      const sql = fs.readFileSync(
        path.join(__dirname, "sql/migrations", file),
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

  const scriptExtension = (() => {
    switch (env.NODE_ENV) {
      case "development":
      case "test":
        return "ts"
      case "production":
        return "js"
    }
  })()

  const functionFiles = await glob(
    path.join(__dirname, `functions/**/*.${scriptExtension}`),
    {
      ignore: {
        ignored: (path) =>
          typeof path.parent === "undefined" ||
          path.parent.isNamed("functions") ||
          path.isNamed(`domain.${scriptExtension}`),
      },
    },
  )

  const functions = functionFiles.map((file) => {
    const filePath = path.dirname(file)
    const fileName = path.basename(file, `.${scriptExtension}`)

    const [root = null, functionsPath = null] = filePath.split("database")

    if (root === null || functionsPath === null) {
      throw new Error(
        `Unable to connect ${scriptExtension} file of function with SQL file. ${scriptExtension} file path: ${file}`,
      )
    }

    return {
      script: file,
      sql: path.join(root, "database/sql", functionsPath, `${fileName}.sql`),
    }
  })

  await Promise.all(
    functions.map(async ({ sql, script }) => {
      const code = await import(script)

      const functionCode = (() => {
        switch (env.NODE_ENV) {
          case "development":
          case "test":
            return code.default
          case "production":
            return code.default.default
        }
      })()

      const f = pipe(functionCode, S.decodeUnknownSync(FunctionTemplate))

      const sqlCode = fs.readFileSync(sql, "utf8")

      const query = template({ ...f, body: sqlCode })
      return await db.query(query)
    }),
  )
}
