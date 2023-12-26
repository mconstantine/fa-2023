import { useEffect, useState } from "react"

if (!("VITE_API_URL" in import.meta.env)) {
  throw new ReferenceError('Unable to find environment variable "VITE_API_URL"')
}

const apiUrl: string = import.meta.env["VITE_API_URL"]

interface ApiError {
  name: string
  message: string
}

interface LoadingResponse {
  type: "loading"
}

interface FailedResponse {
  type: "failure"
  error: {
    status: number
    message: string
  }
}

interface SuccessfulResponse<O> {
  type: "success"
  data: O
}

export type Response<O> =
  | LoadingResponse
  | FailedResponse
  | SuccessfulResponse<O>

export function useQuery<O>(path: string): Response<O> {
  const [state, setState] = useState<Response<O>>({ type: "loading" })

  useEffect(() => {
    window
      .fetch(`${apiUrl}/api${path}`)
      .then((response): Promise<void> => {
        const status = response.status

        return response
          .json()
          .then((response) => ({
            status,
            response,
          }))
          .catch(() => {
            return {
              status: 500,
              response: {
                name: "ParsingError",
                message: "Unable to parse server response",
              } satisfies ApiError,
            }
          })
          .then((result) => {
            if (Math.floor(result.status / 100) !== 2) {
              const error = result.response as ApiError

              setState({
                type: "failure",
                error: {
                  status: result.status,
                  message: error.message,
                },
              })
            } else {
              setState({
                type: "success",
                data: result.response as O,
              })
            }
          })
      })
      .catch(() => {
        setState({
          type: "failure",
          error: {
            status: 500,
            message: "Unable to reach the server",
          },
        })
      })
  }, [path])

  return state
}
