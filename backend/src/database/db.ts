import * as S from "@effect/schema/Schema"
import {
  Pool,
  type PoolClient,
  type QueryArrayConfig,
  type QueryArrayResult,
  type QueryConfig,
  type QueryResult,
  type QueryResultRow,
  type Submittable,
} from "pg"
import { env } from "../env"
import { Effect, pipe } from "effect"

const db = new Pool({
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  port: env.DB_PORT,
  database: env.DB_DATABASE,
})

// This mess is a copy-paste of the signatures of PoolClient.query
export async function query<T extends Submittable>(queryStream: T): Promise<T>
// @ts-expect-error this is a proxy of pg connect method and we trust in pg
export async function query<R extends any[] = any[], I extends any[] = any[]>(
  queryConfig: QueryArrayConfig<I>,
  values?: I,
): Promise<QueryArrayResult<R>>
export async function query<
  R extends QueryResultRow = any,
  I extends any[] = any[],
>(queryConfig: QueryConfig<I>): Promise<QueryResult<R>>
export async function query<
  R extends QueryResultRow = any,
  I extends any[] = any[],
>(
  queryTextOrConfig: string | QueryConfig<I>,
  values?: I,
): Promise<QueryResult<R>>
export async function query<R extends any[] = any[], I extends any[] = any[]>(
  queryConfig: QueryArrayConfig<I>,
  callback: (err: Error, result: QueryArrayResult<R>) => void,
): Promise<void>
export async function query<
  R extends QueryResultRow = any,
  I extends any[] = any[],
>(
  queryTextOrConfig: string | QueryConfig<I>,
  callback: (err: Error, result: QueryResult<R>) => void,
): Promise<void>
export async function query<
  R extends QueryResultRow = any,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  I extends any[] = any[],
>(
  queryText: string,
  values: any[],
  callback: (err: Error, result: QueryResult<R>) => void,
): Promise<void>
export async function query(
  ...args: any[]
): Promise<ReturnType<PoolClient["query"]>> {
  const client = await db.connect()
  // @ts-expect-error this is a proxy of pg connect method and we trust in pg
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const result = await client.query(...args)
  client.release()
  return result
}

export async function getMany<I, O>(
  codec: S.Schema<never, I, O>,
  queryText: string,
): Promise<readonly O[]> {
  const result = await query<I[]>(queryText)
  const validation = pipe(result.rows, S.decodeUnknown(S.array(codec)))

  return await Effect.runPromise(validation)
}

export async function transact<O>(
  callback: (client: PoolClient) => Promise<O>,
): Promise<O> {
  const client = await db.connect()

  try {
    await client.query("begin")
    const result = await callback(client)
    await client.query("commit")
    return result
  } catch (e) {
    await client.query("rollback")
    throw e
  } finally {
    client.release()
  }
}

export async function callFunction<OO, O>(
  name: string,
  outputCodec: S.Schema<never, OO, O>,
  ...input: any[]
): Promise<O> {
  // eslint-disable-next-line array-callback-return
  const encodedInput: string[] = input.map((arg) => {
    switch (typeof arg) {
      case "bigint":
      case "number":
        return arg.toString(10)
      case "boolean":
        return arg ? "true" : "false"
      case "string":
        return `'${arg}'`
      case "function":
      case "symbol":
      case "undefined":
        return "null"
      case "object":
        if (arg === null) {
          return "null"
        } else {
          return `'${JSON.stringify(arg)}'`
        }
    }
  })

  const queryText = `select * from ${name}(${encodedInput.join(
    ", ",
  )}) as result`

  const result = await query<{ result: OO }>(queryText)

  if (typeof result.rows[0] !== "undefined") {
    return S.decodeUnknownSync(outputCodec)(result.rows[0].result)
  } else {
    throw new Error(`Function ${name} did not return anything`)
  }
}
