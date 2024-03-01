import { env } from "../env"
import { sign } from "jsonwebtoken"
import {
  type User,
  type AuthTokens,
  type AuthToken,
} from "./functions/user/domain"

export function AuthTokensFromUser(user: User): AuthTokens {
  const accessToken: AuthToken = {
    expiration: new Date(Date.now() + 86400000),
    value: sign({ id: user.id }, env.JWT_SECRET, {
      expiresIn: "24h",
      issuer: "backend",
    }),
  }

  const refreshToken: AuthToken = {
    expiration: new Date(Date.now() + 604800000),
    value: sign({ id: user.id }, env.JWT_SECRET, {
      expiresIn: "7 days",
      issuer: "backend",
    }),
  }

  return { access: accessToken, refresh: refreshToken }
}
