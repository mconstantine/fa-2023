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
  codec: S.Schema<never, RouteParameters<Path>, O>,
  data: O,
): Effect.Effect<never, HttpError, string> {
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
  codec: S.Schema<never, I, O>,
  data: O,
): Effect.Effect<never, HttpError, string> {
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
  Path extends string,
  ParamsTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  QueryTo,
  BodyFrom,
  BodyTo,
  ResponseFrom,
  ResponseTo,
>(
  request: HttpRequest<
    Path,
    ParamsTo,
    QueryFrom,
    QueryTo,
    BodyFrom,
    BodyTo,
    ResponseFrom,
    ResponseTo
  >,
  data: {
    readonly [key in keyof Omit<
      typeof request.codecs,
      "response"
    >]-?: S.Schema.To<(typeof request.codecs)[key]>
  },
): Effect.Effect<never, HttpError, ResponseTo> {
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

  const bodyEncoding: Effect.Effect<
    never,
    HttpError,
    Option.Option<string>
  > = pipe(
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
  ) {
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

  function parseResponse(response: Response) {
    return Effect.tryPromise({
      try: () => response.json(),
      catch: (error): HttpError => ({
        code: 500,
        message: "Unable to parse server response",
        extras: { error },
      }),
    })
  }

  function decodeResponseContent(response: Response, content: unknown) {
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
  Path extends string,
  ParamsTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  QueryTo,
  ResponseFrom,
  ResponseTo,
  Request extends HttpGetRequest<
    Path,
    ParamsTo,
    QueryFrom,
    QueryTo,
    ResponseFrom,
    ResponseTo
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
  Path extends string,
  ParamsTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  QueryTo,
  ResponseFrom,
  ResponseTo,
>(
  request: HttpGetRequest<
    Path,
    ParamsTo,
    QueryFrom,
    QueryTo,
    ResponseFrom,
    ResponseTo
  >,
): UseLazyQueryOutput<
  Path,
  ParamsTo,
  QueryFrom,
  QueryTo,
  ResponseFrom,
  ResponseTo,
  HttpGetRequest<Path, ParamsTo, QueryFrom, QueryTo, ResponseFrom, ResponseTo>
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
  Path extends string,
  ParamsTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  QueryTo,
  ResponseFrom,
  ResponseTo,
>(
  request: HttpGetRequest<
    Path,
    ParamsTo,
    QueryFrom,
    QueryTo,
    ResponseFrom,
    ResponseTo
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
  Path extends string,
  ParamsTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  QueryTo,
  BodyFrom,
  BodyTo,
  ResponseFrom,
  ResponseTo,
> =
  | HttpPostRequest<
      Path,
      ParamsTo,
      QueryFrom,
      QueryTo,
      BodyFrom,
      BodyTo,
      ResponseFrom,
      ResponseTo
    >
  | HttpPutRequest<
      Path,
      ParamsTo,
      QueryFrom,
      QueryTo,
      BodyFrom,
      BodyTo,
      ResponseFrom,
      ResponseTo
    >
  | HttpPatchRequest<
      Path,
      ParamsTo,
      QueryFrom,
      QueryTo,
      BodyFrom,
      BodyTo,
      ResponseFrom,
      ResponseTo
    >
  | HttpDeleteRequest<
      Path,
      ParamsTo,
      QueryFrom,
      QueryTo,
      ResponseFrom,
      ResponseTo
    >

type UseCommandOutput<
  Path extends string,
  ParamsTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  QueryTo,
  BodyFrom,
  BodyTo,
  ResponseFrom,
  ResponseTo,
  Request extends CommandRequest<
    Path,
    ParamsTo,
    QueryFrom,
    QueryTo,
    BodyFrom,
    BodyTo,
    ResponseFrom,
    ResponseTo
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
  Path extends string,
  ParamsTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  QueryTo,
  BodyFrom,
  BodyTo,
  ResponseFrom,
  ResponseTo,
>(
  request: CommandRequest<
    Path,
    ParamsTo,
    QueryFrom,
    QueryTo,
    BodyFrom,
    BodyTo,
    ResponseFrom,
    ResponseTo
  >,
): UseCommandOutput<
  Path,
  ParamsTo,
  QueryFrom,
  QueryTo,
  BodyFrom,
  BodyTo,
  ResponseFrom,
  ResponseTo,
  CommandRequest<
    Path,
    ParamsTo,
    QueryFrom,
    QueryTo,
    BodyFrom,
    BodyTo,
    ResponseFrom,
    ResponseTo
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
          Path,
          ParamsTo,
          QueryFrom,
          QueryTo,
          BodyFrom,
          BodyTo,
          ResponseFrom,
          ResponseTo
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
