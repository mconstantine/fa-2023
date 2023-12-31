import type { NextFunction, Request, Response } from "express"
import {
  type ExpressErrorMiddlewareInterface,
  Middleware,
  BadRequestError,
  HttpError,
} from "routing-controllers"
import { EntityNotFoundError } from "typeorm"

@Middleware({ type: "after" })
export class ErrorHandler implements ExpressErrorMiddlewareInterface {
  error(
    error: any,
    _request: Request,
    response: Response,
    next: NextFunction,
  ): void {
    if (error instanceof Error) {
      if (error instanceof EntityNotFoundError) {
        response.status(404).json({
          name: error.name,
          message: error.message,
        })
      } else if (error instanceof BadRequestError) {
        response.status(400).json({
          name: error.name,
          message: error.message,
          errors: "errors" in error ? error.errors : null,
        })
      } else if (error instanceof HttpError) {
        response.status(error.httpCode).json({
          name: error.name,
          message: error.message,
        })
      } else {
        console.log(error)

        response.status(500).json({
          name: "UnexpectedError",
          message: "Something unexpected occurred",
        })
      }
    } else {
      next()
    }
  }
}
