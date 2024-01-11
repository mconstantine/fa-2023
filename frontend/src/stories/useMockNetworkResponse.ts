import { useState } from "react"
import { NetworkResponse, networkResponse } from "../network/NetworkResponse"

type UseMockNetworkResponseOutput<T> = [
  response: NetworkResponse<T>,
  trigger: (data: T) => Promise<T>,
  fail: (status: number, message: string) => Promise<void>,
  update: (data: T | ((latestValue: T) => T)) => void,
]

export function useMockNetworkResponse<T>(
  initialValue?: T | (() => T),
): UseMockNetworkResponseOutput<T> {
  const [response, setResponse] = useState(() => {
    if (typeof initialValue !== "undefined") {
      if (typeof initialValue === "function") {
        return networkResponse.fromSuccess((initialValue as () => T)())
      } else {
        return networkResponse.fromSuccess(initialValue)
      }
    } else {
      return networkResponse.make<T>()
    }
  })

  return [
    response,
    (data) =>
      new Promise((resolve) => {
        setResponse((response) => response.load())

        setTimeout(() => {
          setResponse(networkResponse.fromSuccess(data))
          resolve(data)
        }, 500)
      }),
    (status, message) =>
      new Promise((resolve) => {
        setResponse((response) => response.load())

        setTimeout(() => {
          setResponse(networkResponse.fromFailure(status, message))
          resolve()
        }, 500)
      }),
    (update) => {
      if (typeof update === "function") {
        setResponse(
          response.map((data) => (update as (latestValue: T) => T)(data)),
        )
      } else {
        setResponse(networkResponse.fromSuccess(update))
      }
    },
  ]
}
