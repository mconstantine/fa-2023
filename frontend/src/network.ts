import { useEffect, useState } from "react"
import { NetworkResponse } from "./network/NetworkResponse"

if (!("VITE_API_URL" in import.meta.env)) {
  throw new ReferenceError('Unable to find environment variable "VITE_API_URL"')
}

const apiUrl: string = import.meta.env["VITE_API_URL"]

interface ApiError {
  name: string
  message: string
}

async function sendNetworkRequest<O>(
  path: string,
): Promise<NetworkResponse<O>> {
  try {
    const response = await window.fetch(`${apiUrl}/api${path}`)
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

export function useQuery<O>(path: string): NetworkResponse<O> {
  const [state, setState] = useState<NetworkResponse<O>>(
    new NetworkResponse<O>().load(),
  )

  useEffect(() => {
    setState((state) =>
      state.match({
        whenIdle: () => state.load(),
        whenLoading: () => state,
        whenFailed: (response) => response.retry(),
        whenSuccessful: (response) => response.refresh(),
      }),
    )

    sendNetworkRequest<O>(path).then(setState)
  }, [path])

  return state
}
