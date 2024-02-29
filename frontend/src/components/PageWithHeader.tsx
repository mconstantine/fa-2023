import { PropsWithChildren } from "react"
import Header from "./Header"
import { useAuthContext } from "../contexts/AuthContext"
import AuthPage from "./auth/AuthPage"

export function PageWithHeader(props: PropsWithChildren) {
  const authContext = useAuthContext()

  return (
    <>
      <Header />
      {(() => {
        switch (authContext.type) {
          case "Anonymous":
            return <AuthPage />
          case "Authenticated":
            return props.children
        }
      })()}
    </>
  )
}
