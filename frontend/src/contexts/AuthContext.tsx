import * as NetworkResponse from "../network/NetworkResponse"
import { PropsWithChildren, createContext, useContext, useState } from "react"
import {
  AuthTokens,
  InsertUserInput,
  LoginUserInput,
  User,
} from "../../../backend/src/database/functions/user/domain"
import { makeGet, makePost } from "../network/HttpRequest"
import {
  HttpError,
  useSendHttpRequest as useHttpRequest,
} from "../hooks/network"
import { Effect, Either, Exit, Option, identity, pipe } from "effect"

interface AnonymousAuthContext {
  readonly type: "Anonymous"
  networkResponse: NetworkResponse.NetworkResponse<HttpError, unknown>
  register(
    input: InsertUserInput,
  ): Promise<Either.Either<HttpError, AuthTokens>>
  login(input: LoginUserInput): Promise<Either.Either<HttpError, AuthTokens>>
}

interface AuthenticatedAuthContext {
  readonly type: "Authenticated"
  readonly user: User
  readonly authTokens: AuthTokens
  logout(): void
}

type AuthContext = AnonymousAuthContext | AuthenticatedAuthContext

const AuthContext = createContext<AuthContext>({
  type: "Anonymous",
  networkResponse: NetworkResponse.idle(),
  register: () =>
    Promise.resolve(Either.left({ code: 500, message: "Not implemented" })),
  login: () =>
    Promise.resolve(Either.left({ code: 500, message: "Not implemented" })),
})

// This will disable fast refresh, but I don't want to export AuthContext so screw it
// eslint-disable-next-line react-refresh/only-export-components
export function useAuthContext() {
  return useContext(AuthContext)
}

const registerUserRequest = makePost("/users/register/", {
  body: InsertUserInput,
  response: AuthTokens,
})

const loginUserRequest = makePost("/users/login/", {
  body: LoginUserInput,
  response: AuthTokens,
})

const getProfileRequest = makeGet("/users/me/", {
  response: User,
})

export function AuthContextProvider(props: PropsWithChildren) {
  const [registrationResponse, sendRegistrationRequest] =
    useHttpRequest(registerUserRequest)

  const [loginResponse, sendLoginRequest] = useHttpRequest(loginUserRequest)

  const [profileResponse, sendGetProfileRequest] =
    useHttpRequest(getProfileRequest)

  const [state, setState] = useState<AuthContext>({
    type: "Anonymous",
    networkResponse: NetworkResponse.idle(),
    register,
    login,
  })

  const authContextNetworkResponse = pipe(
    [registrationResponse, loginResponse, profileResponse],
    NetworkResponse.any,
  )

  async function getProfile(
    authTokens: AuthTokens,
  ): Promise<Either.Either<HttpError, User>> {
    const result = await Effect.runPromiseExit(
      sendGetProfileRequest({}, Option.some(authTokens)),
    )

    return pipe(
      result,
      Exit.match({
        onFailure: (cause) => {
          return Either.left({
            code: 500,
            message: "The process of getting user profile failed",
            extras: { cause },
          })
        },
        onSuccess: identity,
      }),
    )
  }

  async function register(
    body: InsertUserInput,
  ): Promise<Either.Either<HttpError, AuthTokens>> {
    const registration: Either.Either<HttpError, AuthTokens> = pipe(
      await Effect.runPromiseExit(
        sendRegistrationRequest({ body }, Option.none()),
      ),
      Exit.match({
        onFailure: (cause) => {
          return Either.left({
            code: 500,
            message: "The process of user registration failed",
            extras: { cause },
          })
        },
        onSuccess: identity,
      }),
    )

    if (Either.isLeft(registration)) {
      return registration
    }

    const authTokens = registration.right
    const user = await getProfile(authTokens)

    return pipe(
      user,
      Either.flatMap((user) => {
        setState({
          type: "Authenticated",
          authTokens,
          user,
          logout,
        })

        return Either.right(authTokens)
      }),
    )
  }

  async function login(
    body: LoginUserInput,
  ): Promise<Either.Either<HttpError, AuthTokens>> {
    const login: Either.Either<HttpError, AuthTokens> = pipe(
      await Effect.runPromiseExit(sendLoginRequest({ body }, Option.none())),
      Exit.match({
        onFailure: (cause) => {
          return Either.left({
            code: 500,
            message: "The process of user login failed",
            extras: { cause },
          })
        },
        onSuccess: identity,
      }),
    )

    if (Either.isLeft(login)) {
      return login
    }

    const authTokens = login.right
    const user = await getProfile(authTokens)

    return pipe(
      user,
      Either.flatMap((user) => {
        setState({
          type: "Authenticated",
          authTokens,
          user,
          logout,
        })

        return Either.right(authTokens)
      }),
    )
  }

  function logout() {
    setState({
      type: "Anonymous",
      register,
      login,
      networkResponse: NetworkResponse.idle(),
    })
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        ...(() => {
          switch (state.type) {
            case "Authenticated":
              return {}
            case "Anonymous":
              return { networkResponse: authContextNetworkResponse }
          }
        })(),
      }}
    >
      {props.children}
    </AuthContext.Provider>
  )
}
