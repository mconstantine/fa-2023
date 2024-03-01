import * as S from "@effect/schema/Schema"
import {
  InsertUserInput,
  LoginUserInput,
} from "../database/functions/user/domain"
import { AuthTokensFromUser } from "../database/AuthTokensFromUser"
import { insertUser } from "../database/functions/user/insert_user"
import { HttpError } from "./HttpError"
import { loginUser } from "../database/functions/user/login_user"
import { Router } from "./Router"
import { authMiddleware, verifyAuthToken } from "../middlewares/auth"
import { Effect, Exit, identity, pipe } from "effect"

export const userRouter = Router.post("/register", {
  codecs: {
    body: InsertUserInput,
  },
  handler: async ({ body }) => {
    const user = await (async () => {
      try {
        return await insertUser(body)
      } catch (e) {
        console.log(e)

        throw new HttpError(
          409,
          "Unable to register user. The email address could have already been taken",
        )
      }
    })()

    return AuthTokensFromUser(user)
  },
})
  .post("/login", {
    codecs: {
      body: LoginUserInput,
    },
    handler: async ({ body }) => {
      const user = await (async () => {
        try {
          return await loginUser(body)
        } catch (e) {
          console.log(e)

          throw new HttpError(
            401,
            "Unable to login. Please double check your credentials",
          )
        }
      })()

      return AuthTokensFromUser(user)
    },
  })
  .put("/refresh-token", {
    codecs: {
      body: S.struct({
        refresh_token: S.Trim.pipe(S.nonEmpty()),
      }),
    },
    handler: async ({ body }) => {
      return pipe(
        await Effect.runPromiseExit(
          pipe(
            verifyAuthToken(body.refresh_token),
            Effect.map(AuthTokensFromUser),
          ),
        ),
        Exit.match({
          onSuccess: identity,
          onFailure: (cause) => {
            if (cause._tag === "Fail") {
              throw cause.error
            } else {
              throw new HttpError(500, "Refresh token process failed", {
                cause,
              })
            }
          },
        }),
      )
    },
  })
  .withMiddleware(authMiddleware)
  .get("/me", {
    codecs: {},
    handler: async ({ locals }) => {
      return locals.user
    },
  })
  .toExpressRouter()
