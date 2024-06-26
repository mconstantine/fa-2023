import * as db from "../database/db"
import * as S from "@effect/schema/Schema"
import { Effect, Either, pipe } from "effect"
import { HttpError } from "../routes/HttpError"
import { User } from "../database/functions/user/domain"
import { verify } from "jsonwebtoken"
import { env } from "../env"
import { type Request } from "express"

export function authMiddleware(
  req: Request<
    Record<string, never>,
    never,
    never,
    never,
    Record<string, unknown>
  >,
): Effect.Effect<{ user: User }, HttpError> {
  return pipe(
    req.headers.authorization,
    S.decodeUnknown(S.Trim.pipe(S.nonEmpty())),
    Effect.mapError(() => new HttpError(403, "Missing authentication header")),
    Effect.map((header) => header.slice(7)),
    Effect.flatMap(verifyAuthToken),
    Effect.map((user) => ({ user })),
  )
}

export function verifyAuthToken(
  authToken: string,
): Effect.Effect<User, HttpError> {
  return pipe(
    Effect.try({
      try: () =>
        verify(authToken, env.JWT_SECRET, { issuer: "backend" }) as {
          id: string
        },
      catch: () => new HttpError(403, "Invalid authentication token"),
    }),
    Effect.flatMap(({ id }) =>
      Effect.tryPromise({
        try: async () =>
          await db.getOne(User, 'select * from "user" where id = $1', [id]),
        catch: () => new HttpError(403, "Invalid authentication token"),
      }),
    ),
    Effect.flatMap(
      Either.match({
        onLeft: () => Effect.fail(new HttpError(404, "User not found")),
        onRight: Effect.succeed,
      }),
    ),
  )
}
