import * as S from "@effect/schema/Schema"
import { pipe } from "effect"

const Env = S.struct({
  NODE_ENV: S.literal("development", "test", "production"),
  DB_HOST: S.string.pipe(S.nonEmpty()),
  DB_USER: S.string.pipe(S.nonEmpty()),
  DB_PASSWORD: S.string.pipe(S.nonEmpty()),
  DB_PORT: S.NumberFromString.pipe(S.int()),
  DB_DATABASE: S.string.pipe(S.nonEmpty()),
  SERVER_PORT: S.NumberFromString.pipe(S.int()),
  JWT_SECRET: S.string.pipe(S.minLength(48)).pipe(S.maxLength(48)),
})

export const env = pipe(process.env, S.decodeUnknownSync(Env))
