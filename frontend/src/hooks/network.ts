import { useCallback, useEffect, useState } from "react"
import { NetworkResponse, networkResponse } from "../network/NetworkResponse"

export type Param = string | number | string[] | undefined

if (!("VITE_API_URL" in import.meta.env)) {
  throw new ReferenceError('Unable to find environment variable "VITE_API_URL"')
}

const apiUrl: string = import.meta.env["VITE_API_URL"]

interface ApiError {
  name: string
  message: string
}

function makeNetworkRequest<I>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  data?: I,
): RequestInit {
  return {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    ...(typeof data === "undefined" ? {} : { body: JSON.stringify(data) }),
  }
}

async function sendNetworkRequest<O>(
  path: string,
  request: RequestInit,
): Promise<NetworkResponse<O>> {
  try {
    const response = await window.fetch(`${apiUrl}/api${path}`, request)
    const status = response.status

    try {
      const content = await response.json()

      if (Math.floor(status / 100) === 2) {
        return networkResponse.fromSuccess(content as O)
      } else {
        const error = content as ApiError
        return networkResponse.fromFailure(status, error.message)
      }
    } catch (e) {
      return networkResponse.fromFailure(500, "Unable to parse server response")
    }
  } catch (e) {
    return networkResponse.fromFailure(500, "Unable to reach the server")
  }
}

export type UseLazyQueryOutput<O, I> = [
  response: NetworkResponse<O>,
  optimisticlyUpdate: (update: O | ((oldValue: O) => O)) => void,
  refresh: (query: I) => void,
]

export function useLazyQuery<O>(path: string): UseLazyQueryOutput<O, void>
export function useLazyQuery<O, I extends Record<string, Param>>(
  path: string,
): UseLazyQueryOutput<O, I>
export function useLazyQuery<O, I extends Record<string, Param>, T = O>(
  path: string,
  transformer: (data: O) => T,
): UseLazyQueryOutput<O | T, I>
export function useLazyQuery<O, I extends Record<string, Param>, T = O>(
  path: string,
  transformer?: (data: O) => T,
): UseLazyQueryOutput<O | T, I> {
  const [response, setResponse] = useState<NetworkResponse<O | T>>(
    networkResponse.make<O | T>(),
  )

  const sendQuery = useCallback(
    async (query?: I): Promise<void> => {
      setResponse((response) => response.load())

      const queryString = (() => {
        if (typeof query === "undefined") {
          return ""
        } else {
          const params = new URLSearchParams()

          Object.entries(query).forEach(([name, value]) => {
            if (typeof value === "string") {
              params.append(name, value)
            } else if (typeof value === "number") {
              params.append(name, value.toString(10))
            } else if (typeof value !== "undefined") {
              value.forEach((value) => {
                params.append(name, value)
              })
            }
          })

          return "?" + params.toString()
        }
      })()

      const response = await sendNetworkRequest<O>(
        path + queryString,
        makeNetworkRequest("GET"),
      )

      if (typeof transformer !== "undefined") {
        setResponse(response.map(transformer))
      } else {
        setResponse(response)
      }
    },
    [path, transformer],
  )

  return [
    response,
    (update) => {
      setResponse((response) => {
        if (typeof update === "function") {
          return response.map(update as (data: O | T) => O | T)
        } else {
          return networkResponse.fromSuccess(update)
        }
      })
    },
    sendQuery,
  ]
}

export type UseQueryOutput<O> = [
  response: NetworkResponse<O>,
  optimisticlyUpdate: (update: O | ((oldValue: O) => O)) => void,
  refresh: () => void,
]

export function useQuery<O>(path: string): UseQueryOutput<O>
export function useQuery<I extends Record<string, Param>, O>(
  path: string,
  query: I,
): UseQueryOutput<O>
export function useQuery<I extends Record<string, Param>, O, T = O>(
  path: string,
  query: I,
  transformer: (data: O) => T,
): UseQueryOutput<T>
export function useQuery<I extends Record<string, Param>, O, T = O>(
  path: string,
  query?: I,
  transformer?: (data: O) => T,
): UseQueryOutput<O | T> {
  const [response, update, sendQuery] = useLazyQuery(
    path,
    transformer as (data: O) => T,
  )

  useEffect(() => {
    sendQuery(query as I)
  }, [sendQuery, query])

  return [
    response,
    update as UseQueryOutput<O | T>[1],
    () => sendQuery(query as I),
  ]
}

export type UseCommandOutput<I, O> = [
  response: NetworkResponse<O>,
  sendRequest: (data: I) => Promise<O | null>,
]

export function useCommand<I, O>(
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
): UseCommandOutput<I, O> {
  const [response, setResponse] = useState<NetworkResponse<O>>(
    networkResponse.make<O>(),
  )

  return [
    response,
    async (data) => {
      setResponse((response) => response.load())

      const response = await sendNetworkRequest<O>(
        path,
        makeNetworkRequest(method, data),
      )

      setResponse(response)
      return response.getOrElse(null)
    },
  ]
}

type UseFilesUploadOutput<T> = [
  response: NetworkResponse<T>,
  sendRequest: (files: File[]) => Promise<T | null>,
]

export function useFilesUpload<T>(
  path: string,
  paramName: string,
): UseFilesUploadOutput<T> {
  const [response, setResponse] = useState(networkResponse.make<T>())

  return [
    response,
    async (files) => {
      setResponse((response) => response.load())

      const data = new FormData()

      files.forEach((file) => {
        data.append(paramName, file)
      })

      const request: RequestInit = {
        method: "POST",
        body: data,
      }

      const response = await sendNetworkRequest<T>(path, request)
      setResponse(response)
      return response.getOrElse(null)
    },
  ]
}
