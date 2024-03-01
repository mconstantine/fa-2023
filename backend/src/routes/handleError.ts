import { type Response } from "express"
import { HttpError } from "./HttpError"

export function handleError(e: unknown, response: Response): void {
  if (e instanceof HttpError) {
    response.status(e.code).json({
      error: e.message,
    })
  } else {
    console.log(e)
    response.status(500).json({
      error: "An unexpected error occurred",
    })
  }
}
