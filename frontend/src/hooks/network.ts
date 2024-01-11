import { useCallback, useEffect, useState } from "react"
import { NetworkResponse, networkResponse } from "../network/NetworkResponse"

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

type UseQueryOutput<O> = [
  response: NetworkResponse<O>,
  optimisticlyUpdate: (update: O | ((oldValue: O) => O)) => void,
  refresh: () => void,
]

export function useQuery<O>(path: string): UseQueryOutput<O>
export function useQuery<I extends Record<string, string | undefined>, O>(
  path: string,
  query: I,
): UseQueryOutput<O>
export function useQuery<I extends Record<string, string | undefined>, O>(
  path: string,
  query?: I,
): UseQueryOutput<O> {
  const [response, setResponse] = useState<NetworkResponse<O>>(
    networkResponse.make<O>().load(),
  )

  const sendQuery = useCallback((): Promise<void> => {
    const queryString = (() => {
      if (typeof query === "undefined") {
        return ""
      } else {
        const params = new URLSearchParams()

        Object.entries(query).forEach(([name, value]) => {
          if (typeof value !== "undefined") {
            params.append(name, value)
          }
        })

        return "?" + params.toString()
      }
    })()

    return sendNetworkRequest<O>(
      path + queryString,
      makeNetworkRequest("GET"),
    ).then(setResponse)
  }, [path, query])

  useEffect(() => {
    setResponse((response) => response.load())

    sendQuery()
  }, [sendQuery])

  return [
    response,
    (update) => {
      setResponse((response) => {
        if (typeof update === "function") {
          return response.map(update as (data: O) => O)
        } else {
          return networkResponse.fromSuccess(update)
        }
      })
    },
    sendQuery,
  ]
}

type UseCommandOutput<I, O> = [
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
