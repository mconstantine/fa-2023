import { PropsWithChildren, createContext, useContext, useState } from "react"
import {
  AuthTokens,
  User,
} from "../../../backend/src/database/functions/user/domain"

interface AnonymousAuthContext {
  readonly type: "Anonymous"
}

interface AuthenticatedAuthContext {
  readonly type: "Authenticated"
  readonly user: User
  readonly authTokens: AuthTokens
}

type AuthContext = AnonymousAuthContext | AuthenticatedAuthContext

const AuthContext = createContext<AuthContext>({
  type: "Anonymous",
})

// This will disable fast refresh, but I don't want to export AuthContext so screw it
// eslint-disable-next-line react-refresh/only-export-components
export function useAuthContext() {
  return useContext(AuthContext)
}

export function AuthContextProvider(props: PropsWithChildren) {
  const [state] = useState<AuthContext>({
    type: "Anonymous",
  })

  return (
    <AuthContext.Provider value={state}>{props.children}</AuthContext.Provider>
  )
}
