import * as S from "@effect/schema/Schema"
import { pipe } from "effect"

const Env = S.struct({
  NODE_ENV: S.union(S.literal("development"), S.literal("test")),
  DB_HOST: S.string.pipe(S.nonEmpty()),
  DB_USER: S.string.pipe(S.nonEmpty()),
  DB_PASSWORD: S.string.pipe(S.nonEmpty()),
  DB_PORT: S.NumberFromString.pipe(S.int()),
  DB_DATABASE: S.string.pipe(S.nonEmpty()),
})

export const env = pipe(process.env, S.decodeUnknownSync(Env))
