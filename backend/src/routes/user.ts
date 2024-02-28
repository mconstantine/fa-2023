import {
  type AuthTokens,
  InsertUserInput,
  AuthTokensFromUser,
  LoginUserInput,
} from "../database/functions/user/domain"
import { insertUser } from "../database/functions/user/insert_user"
import { HttpError } from "./HttpError"
import { loginUser as loginUserDb } from "../database/functions/user/login_user"
import { Router } from "./Router"

export const userRouter = Router.post("/register", {
  codecs: {
    body: InsertUserInput,
  },
  handler: async ({ body }) => await registerUser(body),
}).post("/login", {
  codecs: {
    body: LoginUserInput,
  },
  handler: async ({ body }) => await loginUser(body),
})

export async function registerUser(body: InsertUserInput): Promise<AuthTokens> {
  const user = await (async () => {
    try {
      return await insertUser(body)
    } catch (e) {
      throw new HttpError(
        409,
        "Unable to register user. The email address could have already been taken",
      )
    }
  })()

  return AuthTokensFromUser(user)
}

export async function loginUser(body: LoginUserInput): Promise<AuthTokens> {
  const user = await (async () => {
    try {
      return await loginUserDb(body)
    } catch (e) {
      throw new HttpError(401, "Unable to login. Double check your credentials")
    }
  })()

  return AuthTokensFromUser(user)
}
