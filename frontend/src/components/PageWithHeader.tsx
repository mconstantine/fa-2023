import { PropsWithChildren } from "react"
import Header from "./Header"

export function PageWithHeader(props: PropsWithChildren) {
  return (
    <>
      <Header />
      {props.children}
    </>
  )
}
