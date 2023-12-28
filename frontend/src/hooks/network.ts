import { useEffect, useState } from "react"
import { NetworkResponse } from "../network/NetworkResponse"

if (!("VITE_API_URL" in import.meta.env)) {
  throw new ReferenceError('Unable to find environment variable "VITE_API_URL"')
}

const apiUrl: string = import.meta.env["VITE_API_URL"]

interface ApiError {
  name: string
  message: string
}

async function sendNetworkRequest<I, O>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  data?: I,
): Promise<NetworkResponse<O>> {
  try {
    const response = await window.fetch(`${apiUrl}/api${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      ...(typeof data === "undefined" ? {} : { body: JSON.stringify(data) }),
    })

    const status = response.status

    try {
      const content = await response.json()

      if (Math.floor(status / 100) === 2) {
        return NetworkResponse.fromSuccess(content as O)
      } else {
        const error = content as ApiError
        return NetworkResponse.fromFailure(status, error.message)
      }
    } catch (e) {
      return NetworkResponse.fromFailure(500, "Unable to parse server response")
    }
  } catch (e) {
    return NetworkResponse.fromFailure(500, "Unable to reach the server")
  }
}

type UseQueryOutput<O> = [
  response: NetworkResponse<O>,
  optimisticlyUpdate: (update: O | ((oldValue: O) => O)) => void,
]

export function useQuery<O>(path: string): UseQueryOutput<O> {
  const [response, setResponse] = useState<NetworkResponse<O>>(
    new NetworkResponse<O>().load(),
  )

  useEffect(() => {
    setResponse((state) =>
      state.match({
        whenIdle: () => state.load(),
        whenLoading: () => state,
        whenFailed: (response) => response.retry(),
        whenSuccessful: (response) => response.refresh(),
      }),
    )

    sendNetworkRequest<void, O>("GET", path).then(setResponse)
  }, [path])

  return [
    response,
    (update) => {
      setResponse((response) => {
        if (typeof update === "function") {
          return response.map(update as (data: O) => O)
        } else {
          return NetworkResponse.fromSuccess(update)
        }
      })
    },
  ]
}

type UseCommandOutput<I, O> = [
  response: NetworkResponse<O>,
  sendRequest: (data: I) => Promise<O | null>,
]

export function useCommand<I, O>(
  method: "POST" | "PUT" | "PATCH",
  path: string,
): UseCommandOutput<I, O> {
  const [response, setResponse] = useState<NetworkResponse<O>>(
    new NetworkResponse<O>(),
  )

  return [
    response,
    async (data) => {
      setResponse((response) => response.load())
      const response = await sendNetworkRequest<I, O>(method, path, data)
      setResponse(response)

      return response.match({
        whenIdle: () => null,
        whenLoading: () => null,
        whenFailed: () => null,
        whenSuccessful: (response) => response.data,
      })
    },
  ]
}
