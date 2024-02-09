import * as S from "@effect/schema/Schema"
import {
  HttpGetRequest,
  HttpRequest,
  HttpRequestCodecs,
  RouteParameters,
} from "../network/HttpRequest"
import { env } from "../env"
import { Cause, Effect, Either, Exit, Option, flow, pipe } from "effect"
import { Dispatch, SetStateAction, useEffect, useState } from "react"
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
  data: HttpRequestData<
    ParamsTo,
    RouteParameters<Path>,
    QueryTo,
    QueryFrom,
    BodyTo,
    BodyFrom,
    ResponseTo,
    ResponseFrom,
    typeof request.codecs
  >,
): Effect.Effect<ResponseTo, HttpError> {
  const urlTemplate = (env.VITE_API_URL + request.path) as Path

  const paramsEncoding = (() => {
    if ("params" in data && typeof request.codecs.params !== "undefined") {
      return populateUrlParams(urlTemplate, request.codecs.params, data.params)
    } else {
      return Effect.succeed(urlTemplate)
    }
  })()

  const bodyEncoding: Effect.Effect<Option.Option<string>, HttpError> = pipe(
    request.codecs.body,
    Option.fromNullable,
    Option.match({
      onNone: () => Effect.succeed(Option.none()),
      onSome: (codec) => {
        if ("body" in data) {
          return S.encode(codec)(data.body).pipe(
            Effect.mapBoth({
              onFailure: (error): HttpError => ({
                code: 500,
                message: "Invalid request body",
                extras: { error },
              }),
              onSuccess: flow(JSON.stringify, Option.some),
            }),
          )
        } else {
          return Effect.succeed(Option.none())
        }
      },
    }),
  )

  function encodeQuery(urlWithParams: string) {
    if ("query" in data && typeof request.codecs.query !== "undefined") {
      return populateUrlQuery(urlWithParams, request.codecs.query, data.query)
    } else {
      return Effect.succeed(urlWithParams)
    }
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
          pipe(
            parseResponse(response),
            Effect.flatMap((content) =>
              decodeResponseContent(response, content),
            ),
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
  refresh: (
    data: HttpRequestData<
      ParamsTo,
      RouteParameters<Path>,
      QueryTo,
      QueryFrom,
      never,
      never,
      ResponseTo,
      ResponseFrom,
      Request["codecs"]
    >,
  ) => void,
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

  function sendQuery(
    data: HttpRequestData<
      ParamsTo,
      RouteParameters<Path>,
      QueryTo,
      QueryFrom,
      never,
      never,
      ResponseTo,
      ResponseFrom,
      typeof request.codecs
    >,
  ): void {
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

type HttpRequestData<
  ParamsTo,
  Path extends Record<string, string | undefined>,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  BodyTo,
  BodyFrom,
  ResponseTo,
  ResponseFrom,
  Codecs extends HttpRequestCodecs<
    ParamsTo,
    Path,
    QueryTo,
    QueryFrom,
    BodyTo,
    BodyFrom,
    ResponseTo,
    ResponseFrom
  >,
> = (S.Schema.To<Codecs["params"]> extends never
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    {}
  : {
      params: ParamsTo
    }) &
  (S.Schema.To<Codecs["query"]> extends never
    ? // eslint-disable-next-line @typescript-eslint/ban-types
      {}
    : {
        query: QueryTo
      }) &
  (S.Schema.To<Codecs["body"]> extends never
    ? // eslint-disable-next-line @typescript-eslint/ban-types
      {}
    : {
        body: BodyTo
      })

export function useRequestData<
  Request extends HttpRequest<
    ParamsTo,
    Path,
    QueryTo,
    QueryFrom,
    BodyTo,
    BodyFrom,
    ResponseTo,
    ResponseFrom
  >,
  ParamsTo = S.Schema.To<Request["codecs"]["params"]>,
  Path extends string = string,
  QueryTo = S.Schema.To<Request["codecs"]["query"]>,
  QueryFrom extends Record<
    string,
    string | readonly string[] | undefined
  > = S.Schema.From<Request["codecs"]["query"]>,
  BodyTo = S.Schema.To<Request["codecs"]["body"]>,
  BodyFrom = S.Schema.From<Request["codecs"]["body"]>,
  ResponseTo = S.Schema.To<Request["codecs"]["response"]>,
  ResponseFrom = S.Schema.From<Request["codecs"]["response"]>,
>(
  data: HttpRequestData<
    ParamsTo,
    RouteParameters<Path>,
    QueryTo,
    QueryFrom,
    BodyTo,
    BodyFrom,
    ResponseTo,
    ResponseFrom,
    HttpRequestCodecs<
      ParamsTo,
      RouteParameters<Path>,
      QueryTo,
      QueryFrom,
      BodyTo,
      BodyFrom,
      ResponseTo,
      ResponseFrom
    >
  >,
): [
  HttpRequestData<
    ParamsTo,
    RouteParameters<Path>,
    QueryTo,
    QueryFrom,
    BodyTo,
    BodyFrom,
    ResponseTo,
    ResponseFrom,
    HttpRequestCodecs<
      ParamsTo,
      RouteParameters<Path>,
      QueryTo,
      QueryFrom,
      BodyTo,
      BodyFrom,
      ResponseTo,
      ResponseFrom
    >
  >,
  Dispatch<
    SetStateAction<
      HttpRequestData<
        ParamsTo,
        RouteParameters<Path>,
        QueryTo,
        QueryFrom,
        BodyTo,
        BodyFrom,
        ResponseTo,
        ResponseFrom,
        HttpRequestCodecs<
          ParamsTo,
          RouteParameters<Path>,
          QueryTo,
          QueryFrom,
          BodyTo,
          BodyFrom,
          ResponseTo,
          ResponseFrom
        >
      >
    >
  >,
] {
  return useState(data)
}

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
  data: HttpRequestData<
    ParamsTo,
    RouteParameters<Path>,
    QueryTo,
    QueryFrom,
    never,
    never,
    ResponseTo,
    ResponseFrom,
    typeof request.codecs
  >,
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

type UseCommandOutput<
  ParamsTo,
  Path extends string,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  BodyTo,
  BodyFrom,
  ResponseTo,
  ResponseFrom,
> = [
  response: NetworkResponse<ResponseTo>,
  execute: (
    data: HttpRequestData<
      ParamsTo,
      RouteParameters<Path>,
      QueryTo,
      QueryFrom,
      BodyTo,
      BodyFrom,
      ResponseTo,
      ResponseFrom,
      HttpRequestCodecs<
        ParamsTo,
        RouteParameters<Path>,
        QueryTo,
        QueryFrom,
        BodyTo,
        BodyFrom,
        ResponseTo,
        ResponseFrom
      >
    >,
  ) => Promise<Either.Either<HttpError, ResponseTo>>,
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
): UseCommandOutput<
  ParamsTo,
  Path,
  QueryTo,
  QueryFrom,
  BodyTo,
  BodyFrom,
  ResponseTo,
  ResponseFrom
> {
  const [response, setResponse] = useState<NetworkResponse<ResponseTo>>(
    networkResponse.make(),
  )

  function sendCommand(
    data: HttpRequestData<
      ParamsTo,
      RouteParameters<Path>,
      QueryTo,
      QueryFrom,
      BodyTo,
      BodyFrom,
      ResponseTo,
      ResponseFrom,
      typeof request.codecs
    >,
  ): Promise<Either.Either<HttpError, ResponseTo>> {
    setResponse((response) => response.load())

    return Effect.runPromiseExit(sendHttpRequest(request, data)).then(
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
