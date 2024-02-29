import * as S from "@effect/schema/Schema"
import { Email } from "../../domain"

export const InsertUserInput = S.struct({
  name: S.Trim.pipe(S.nonEmpty()),
  email: S.Trim.pipe(Email),
  password: S.Trim.pipe(S.nonEmpty()),
})

export interface InsertUserInput extends S.Schema.To<typeof InsertUserInput> {}

export const LoginUserInput = S.struct({
  email: S.Trim.pipe(Email),
  password: S.Trim.pipe(S.nonEmpty()),
})

export interface LoginUserInput extends S.Schema.To<typeof LoginUserInput> {}

export const UpdateUserInput = S.struct({
  name: S.optional(S.Trim.pipe(S.nonEmpty())),
  email: S.optional(S.Trim.pipe(Email)),
  password: S.optional(S.Trim.pipe(S.nonEmpty())),
})

export interface UpdateUserInput extends S.Schema.To<typeof UpdateUserInput> {}

export const User = S.struct({
  id: S.UUID,
  name: S.Trim.pipe(S.nonEmpty()),
  email: S.Trim.pipe(Email),
})

export interface User extends S.Schema.To<typeof User> {}

const AuthTokenType = S.literal("access", "refresh")

export const AuthToken = S.struct({
  value: S.string,
  expiration: S.Date,
})

export interface AuthToken extends S.Schema.To<typeof AuthToken> {}

export const AuthTokens = S.record(AuthTokenType, AuthToken)

export interface AuthTokens extends S.Schema.To<typeof AuthTokens> {}
