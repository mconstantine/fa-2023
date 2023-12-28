import { useState } from "react"
import { NetworkResponse } from "../network/NetworkResponse"

type UseMockNetworkResponseOutput<T> = [
  response: NetworkResponse<T>,
  trigger: (data: T) => void,
  fail: (status: number, message: string) => void,
]

export function useMockNetworkResponse<T>(
  initialValue?: T | (() => T),
): UseMockNetworkResponseOutput<T> {
  const [response, setResponse] = useState(() => {
    if (typeof initialValue !== "undefined") {
      if (typeof initialValue === "function") {
        return NetworkResponse.fromSuccess((initialValue as () => T)())
      } else {
        return NetworkResponse.fromSuccess(initialValue)
      }
    } else {
      return new NetworkResponse<T>()
    }
  })

  return [
    response,
    (data) => {
      setResponse((response) => response.load())
      setTimeout(() => setResponse(NetworkResponse.fromSuccess(data)), 500)
    },
    (status, message) => {
      setResponse((response) => response.load())
      setTimeout(
        () => setResponse(NetworkResponse.fromFailure(status, message)),
        500,
      )
    },
  ]
}
