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
