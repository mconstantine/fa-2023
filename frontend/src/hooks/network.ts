import * as S from "@effect/schema/Schema"
import {
  HttpDeleteRequest,
  HttpGetRequest,
  HttpPatchRequest,
  HttpPostRequest,
  HttpPutRequest,
  HttpRequest,
  RouteParameters,
} from "../network/HttpRequest"
import { env } from "../env"
import { Cause, Effect, Either, Exit, Option, flow, pipe } from "effect"
import { useEffect, useState } from "react"
import { NetworkResponse, networkResponse } from "../network/NetworkResponse"
import { identity } from "effect/Function"

const ApiError = S.struct({
  error: S.string,
})

interface HttpError {
  code: number
  message: string
  extras?: unknown
}

export function populateUrlParams<Path extends string, O>(
  urlTemplate: Path,
  codec: S.Schema<O, RouteParameters<Path>>,
  data: O,
): Effect.Effect<string, HttpError> {
  return pipe(
    data,
    S.encode(codec),
    Effect.mapBoth({
      onFailure: (error): HttpError => ({
        code: 500,
        message: "Invalid request params",
        extras: { error },
      }),
      onSuccess: (params) =>
        Object.entries<string>(params).reduce<string>(
          (result, [key, value]) => result.replace(`:${key}`, value),
          urlTemplate,
        ),
    }),
  )
}

export function populateUrlQuery<
  I extends Record<string, string | readonly string[] | undefined>,
  O,
>(
  url: string,
  codec: S.Schema<O, I>,
  data: O,
): Effect.Effect<string, HttpError> {
  return pipe(
    data,
    S.encode(codec),
    Effect.mapBoth({
      onFailure: (error): HttpError => ({
        code: 500,
        message: "Invalid request query",
        extras: { error },
      }),
      onSuccess: (params) => {
        const query = new URLSearchParams()

        for (const [name, value] of Object.entries(params)) {
          if (typeof value !== "undefined") {
            if (Array.isArray(value)) {
              value.forEach((value) => query.append(name, value))
            } else {
              query.append(name, value as string)
            }
          }
        }

        return url + "?" + query.toString()
      },
    }),
  )
}

function sendHttpRequest<
  ParamsTo,
  Path extends string,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  BodyTo,
  BodyFrom,
  ResponseTo,
  ResponseFrom,
>(
  request: HttpRequest<
    ParamsTo,
    Path,
    QueryTo,
    QueryFrom,
    BodyTo,
    BodyFrom,
    ResponseTo,
    ResponseFrom
  >,
  data: {
    readonly [key in keyof Omit<
      typeof request.codecs,
      "response"
    >]-?: S.Schema.To<(typeof request.codecs)[key]>
  },
): Effect.Effect<ResponseTo, HttpError> {
  const urlTemplate = (env.VITE_API_URL + request.path) as Path

  const paramsEncoding = pipe(
    request.codecs.params,
    Option.fromNullable,
    Option.match({
      onNone: () => Effect.succeed(urlTemplate),
      onSome: (codec) =>
        populateUrlParams<Path, ParamsTo>(urlTemplate, codec, data.params),
    }),
  )

  const bodyEncoding: Effect.Effect<Option.Option<string>, HttpError> = pipe(
    request.codecs.body,
    Option.fromNullable,
    Option.match({
      onNone: () => Effect.succeed(Option.none()),
      onSome: (codec) =>
        S.encode(codec)(data.body).pipe(
          Effect.mapBoth({
            onFailure: (error): HttpError => ({
              code: 500,
              message: "Invalid request body",
              extras: { error },
            }),
            onSuccess: flow(JSON.stringify, Option.some),
          }),
        ),
    }),
  )

  function encodeQuery(urlWithParams: string) {
    return pipe(
      request.codecs.query,
      Option.fromNullable,
      Option.match({
        onNone: () => Effect.succeed(urlWithParams),
        onSome: (codec) => populateUrlQuery(urlWithParams, codec, data.query),
      }),
    )
  }

  function sendRequest(
    urlWithParamsAndQuery: string,
    body: Option.Option<string>,
  ): Effect.Effect<Response, HttpError> {
    return Effect.tryPromise({
      try: () =>
        window.fetch(urlWithParamsAndQuery, {
          method: request.method,
          ...pipe(
            body,
            Option.match({
              onNone: () => ({}),
              onSome: (body) => ({ body }),
            }),
          ),
          ...pipe(
            body,
            Option.match({
              onNone: () => ({}),
              onSome: () => ({
                headers: {
                  "Content-Type": "application/json; charset=utf-8",
                },
              }),
            }),
          ),
        }),
      catch: (error): HttpError => ({
        code: 500,
        message: "Unable to reach the server",
        extras: { error },
      }),
    })
  }

  function parseResponse(
    response: Response,
  ): Effect.Effect<unknown, HttpError> {
    return Effect.tryPromise({
      try: () => response.json(),
      catch: (error): HttpError => ({
        code: 500,
        message: "Unable to parse server response",
        extras: { error },
      }),
    })
  }

  function decodeResponseContent(
    response: Response,
    content: unknown,
  ): Effect.Effect<ResponseTo, HttpError> {
    if (Math.floor(response.status / 100) !== 2) {
      return S.decodeUnknown(ApiError)(content)
        .pipe(
          Effect.mapError(
            (error): HttpError => ({
              code: 500,
              message: "Unable to decode server error",
              extras: { error },
            }),
          ),
        )
        .pipe(
          Effect.flatMap((error) =>
            Effect.fail({
              code: response.status,
              message: error.error,
            } satisfies HttpError),
          ),
        )
    } else {
      return S.decodeUnknown(request.codecs.response)(content).pipe(
        Effect.mapError(
          (error): HttpError => ({
            code: 500,
            message: "Unable to decode server response",
            extras: { error },
          }),
        ),
      )
    }
  }

  return pipe(
    paramsEncoding,
    Effect.flatMap(encodeQuery),
    Effect.flatMap((urlWithParamsAndQuery) =>
      pipe(
        bodyEncoding,
        Effect.flatMap((body) => sendRequest(urlWithParamsAndQuery, body)),
        Effect.flatMap((response) =>
          pipe(parseResponse(response), (content) =>
            decodeResponseContent(response, content),
          ),
        ),
      ),
    ),
  )
}

function causeToHttpError(cause: Cause.Cause<HttpError>): HttpError {
  return pipe(
    cause,
    Cause.match<HttpError, HttpError>({
      onDie: (defect) => ({
        code: 500,
        message: "Unexpected failure",
        extras: { defect },
      }),
      onEmpty: {
        code: 500,
        message: "Request process failed with no errors",
      },
      onInterrupt: (fiberId) => ({
        code: 500,
        message: "Request process was interrupted",
        extras: { fiberId },
      }),
      onParallel: (left, right) => ({
        code: 500,
        message: "Parallel failures during request process",
        extras: { left, right },
      }),
      onSequential: (left, right) => ({
        code: 500,
        message: "Sequential failures during request process",
        extras: { left, right },
      }),
      onFail: identity,
    }),
  )
}

type UseLazyQueryOutput<
  ParamsTo,
  Path extends string,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  ResponseTo,
  ResponseFrom,
  Request extends HttpGetRequest<
    ParamsTo,
    Path,
    QueryTo,
    QueryFrom,
    ResponseTo,
    ResponseFrom
  >,
> = [
  response: NetworkResponse<ResponseTo>,
  refresh: (data: {
    readonly [key in keyof Omit<Request["codecs"], "response">]-?: S.Schema.To<
      Request["codecs"][key]
    >
  }) => void,
  optimisticUpdate: (data: ResponseTo) => void,
]

export function useLazyQuery<
  ParamsTo,
  Path extends string,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  ResponseTo,
  ResponseFrom,
>(
  request: HttpGetRequest<
    ParamsTo,
    Path,
    QueryTo,
    QueryFrom,
    ResponseTo,
    ResponseFrom
  >,
): UseLazyQueryOutput<
  ParamsTo,
  Path,
  QueryTo,
  QueryFrom,
  ResponseTo,
  ResponseFrom,
  HttpGetRequest<ParamsTo, Path, QueryTo, QueryFrom, ResponseTo, ResponseFrom>
> {
  const [response, setResponse] = useState<NetworkResponse<ResponseTo>>(
    networkResponse.make(),
  )

  function sendQuery(data: {
    readonly [key in keyof Omit<
      typeof request.codecs,
      "response"
    >]-?: S.Schema.To<(typeof request.codecs)[key]>
  }): void {
    setResponse((response) => response.load())

    Effect.runPromiseExit(sendHttpRequest(request, data)).then(
      flow(
        Exit.match({
          onFailure(cause) {
            const error: HttpError = causeToHttpError(cause)

            setResponse((response) =>
              response.match({
                onIdle: identity,
                onSuccess: identity,
                onFailure: identity,
                onLoading: (response) => {
                  console.log(error.extras)
                  return response.fail(error.code, error.message)
                },
              }),
            )
          },
          onSuccess(data) {
            setResponse((response) =>
              response.match({
                onIdle: identity,
                onSuccess: identity,
                onFailure: identity,
                onLoading: (response) => response.succeed(data),
              }),
            )
          },
        }),
      ),
    )
  }

  function update(data: ResponseTo): void {
    setResponse((response) => response.map(() => data))
  }

  return [response, sendQuery, update]
}

type UseQueryOutput<Response> = [
  response: NetworkResponse<Response>,
  optimisticUpdate: (data: Response) => void,
]

export function useQuery<
  ParamsTo,
  Path extends string,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  ResponseTo,
  ResponseFrom,
>(
  request: HttpGetRequest<
    ParamsTo,
    Path,
    QueryTo,
    QueryFrom,
    ResponseTo,
    ResponseFrom
  >,
  data: {
    readonly [key in keyof Omit<
      typeof request.codecs,
      "response"
    >]-?: S.Schema.To<(typeof request.codecs)[key]>
  },
): UseQueryOutput<ResponseTo> {
  const [response, setResponse] = useState<NetworkResponse<ResponseTo>>(
    networkResponse.make(),
  )

  useEffect(() => {
    setResponse((response) => response.load())

    Effect.runPromiseExit(sendHttpRequest(request, data)).then(
      flow(
        Exit.match({
          onFailure(cause) {
            const error: HttpError = causeToHttpError(cause)

            setResponse((response) =>
              response.match({
                onIdle: identity,
                onSuccess: identity,
                onFailure: identity,
                onLoading: (response) => {
                  console.log(error.extras)
                  return response.fail(error.code, error.message)
                },
              }),
            )
          },
          onSuccess(data) {
            setResponse((response) =>
              response.match({
                onIdle: identity,
                onSuccess: identity,
                onFailure: identity,
                onLoading: (response) => response.succeed(data),
              }),
            )
          },
        }),
      ),
    )
  }, [request, data])

  function update(data: ResponseTo): void {
    setResponse((response) => response.map(() => data))
  }

  return [response, update]
}

type CommandRequest<
  ParamsTo,
  Path extends string,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  BodyTo,
  BodyFrom,
  ResponseTo,
  ResponseFrom,
> =
  | HttpPostRequest<
      ParamsTo,
      Path,
      QueryTo,
      QueryFrom,
      BodyTo,
      BodyFrom,
      ResponseTo,
      ResponseFrom
    >
  | HttpPutRequest<
      ParamsTo,
      Path,
      QueryTo,
      QueryFrom,
      BodyTo,
      BodyFrom,
      ResponseTo,
      ResponseFrom
    >
  | HttpPatchRequest<
      ParamsTo,
      Path,
      QueryTo,
      QueryFrom,
      BodyTo,
      BodyFrom,
      ResponseTo,
      ResponseFrom
    >
  | HttpDeleteRequest<
      ParamsTo,
      Path,
      QueryTo,
      QueryFrom,
      ResponseTo,
      ResponseFrom
    >

type UseCommandOutput<
  ParamsTo,
  Path extends string,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  BodyTo,
  BodyFrom,
  ResponseTo,
  ResponseFrom,
  Request extends CommandRequest<
    ParamsTo,
    Path,
    QueryTo,
    QueryFrom,
    BodyTo,
    BodyFrom,
    ResponseTo,
    ResponseFrom
  >,
> = [
  response: NetworkResponse<ResponseTo>,
  execute: (data: {
    readonly [key in keyof Omit<Request["codecs"], "response">]-?: S.Schema.To<
      Request["codecs"][key]
    >
  }) => Promise<Either.Either<HttpError, ResponseTo>>,
]

export function useCommand<
  ParamsTo,
  Path extends string,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  BodyTo,
  BodyFrom,
  ResponseTo,
  ResponseFrom,
>(
  request: CommandRequest<
    ParamsTo,
    Path,
    QueryTo,
    QueryFrom,
    BodyTo,
    BodyFrom,
    ResponseTo,
    ResponseFrom
  >,
): UseCommandOutput<
  ParamsTo,
  Path,
  QueryTo,
  QueryFrom,
  BodyTo,
  BodyFrom,
  ResponseTo,
  ResponseFrom,
  CommandRequest<
    ParamsTo,
    Path,
    QueryTo,
    QueryFrom,
    BodyTo,
    BodyFrom,
    ResponseTo,
    ResponseFrom
  >
> {
  const [response, setResponse] = useState<NetworkResponse<ResponseTo>>(
    networkResponse.make(),
  )

  function sendCommand(data: {
    readonly [key in keyof Omit<
      typeof request.codecs,
      "response"
    >]-?: S.Schema.To<(typeof request.codecs)[key]>
  }): Promise<Either.Either<HttpError, ResponseTo>> {
    setResponse((response) => response.load())

    return Effect.runPromiseExit(
      sendHttpRequest(
        request as HttpRequest<
          ParamsTo,
          Path,
          QueryTo,
          QueryFrom,
          BodyTo,
          BodyFrom,
          ResponseTo,
          ResponseFrom
        >,
        data,
      ),
    ).then(
      flow(
        Exit.match({
          onFailure(cause) {
            const error: HttpError = causeToHttpError(cause)

            setResponse((response) =>
              response.match({
                onIdle: identity,
                onSuccess: identity,
                onFailure: identity,
                onLoading: (response) => {
                  console.log(error.extras)
                  return response.fail(error.code, error.message)
                },
              }),
            )

            return Either.left(error)
          },
          onSuccess(data) {
            setResponse((response) =>
              response.match({
                onIdle: identity,
                onSuccess: identity,
                onFailure: identity,
                onLoading: (response) => response.succeed(data),
              }),
            )

            return Either.right(data)
          },
        }),
      ),
    )
  }

  return [response, sendCommand]
}
