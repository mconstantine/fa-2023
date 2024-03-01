import { env } from "../env"
import { sign } from "jsonwebtoken"
import {
  type User,
  type AuthTokens,
  type AuthToken,
} from "./functions/user/domain"

export function AuthTokensFromUser(user: User): AuthTokens {
  const accessToken: AuthToken = {
    // FIXME:
    // expiration: new Date(Date.now() + 86400000),
    expiration: new Date(Date.now() + 1000),
    value: sign({ id: user.id }, env.JWT_SECRET, {
      // FIXME:
      // expiresIn: "24h",
      expiresIn: 1,
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
