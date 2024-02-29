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
import * as NetworkResponse from "../network/NetworkResponse"
import { identity } from "effect/Function"
import { useSearchParams } from "react-router-dom"
import { AuthTokens } from "../../../backend/src/database/functions/user/domain"
import { useAuthContext } from "../contexts/AuthContext"

type HttpRequestType = "JSON" | "FormData"

const ApiError = S.struct({
  error: S.string,
})

export interface HttpError {
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
              value.forEach((value) => query.append(`${name}[]`, value))
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

export function decodeUrlQuery<I, O>(
  codec: S.Schema<O, I>,
  query: URLSearchParams,
): Effect.Effect<O, HttpError> {
  const encoded: Record<string, unknown> = {}

  for (const [key, value] of query.entries()) {
    if (key.endsWith("[]")) {
      const name = key.slice(0, key.length - 2)

      if (name in encoded) {
        const a = encoded[name] as unknown[]
        a.push(value)
      } else {
        encoded[name] = [value]
      }
    } else {
      encoded[key] = value
    }
  }

  return pipe(
    encoded,
    S.decodeUnknown(codec),
    Effect.mapError((error) => ({
      code: 500,
      message: "Unable to decode search params",
      extras: { error },
    })),
  )
}

function encodeParams<
  ParamsTo,
  Path extends string,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  BodyTo,
  BodyFrom,
  ResponseTo,
  ResponseFrom,
>(
  urlTemplate: Path,
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
) {
  if ("params" in data && typeof request.codecs.params !== "undefined") {
    return populateUrlParams(urlTemplate, request.codecs.params, data.params)
  } else {
    return Effect.succeed(urlTemplate)
  }
}

function encodeQuery<
  ParamsTo,
  Path extends string,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  BodyTo,
  BodyFrom,
  ResponseTo,
  ResponseFrom,
>(
  urlWithParams: string,
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
) {
  if ("query" in data && typeof request.codecs.query !== "undefined") {
    return populateUrlQuery(urlWithParams, request.codecs.query, data.query)
  } else {
    return Effect.succeed(urlWithParams)
  }
}

function encodeJSONBody<
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
): Effect.Effect<Option.Option<string>, HttpError> {
  return pipe(
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
}

function encodeFormDataBody<
  ParamsTo,
  Path extends string,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  BodyTo,
  BodyFrom extends Record<string, string | Blob>,
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
): Effect.Effect<Option.Option<FormData>, HttpError> {
  return pipe(
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
              onSuccess: (data) => {
                const formData = new FormData()

                Object.entries(data).forEach(([key, value]) => {
                  formData.append(key, value)
                })

                return Option.some(formData)
              },
            }),
          )
        } else {
          return Effect.succeed(Option.none())
        }
      },
    }),
  )
}

function sendRequest<
  ParamsTo,
  Path extends string,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  BodyTo,
  BodyFrom,
  ResponseTo,
  ResponseFrom,
>(
  type: HttpRequestType,
  urlWithParamsAndQuery: string,
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
  body: Option.Option<string | FormData>,
  authTokens: Option.Option<AuthTokens>,
): Effect.Effect<Response, HttpError> {
  const headers: HeadersInit = {}

  if (Option.isSome(body) && type === "JSON") {
    headers["Content-Type"] = "application/json; charset=utf-8"
  }

  if (Option.isSome(authTokens)) {
    headers["Authorization"] = `Bearer ${authTokens.value.access.value}`
  }

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
        headers,
      }),
    catch: (error): HttpError => ({
      code: 500,
      message: "Unable to reach the server",
      extras: { error },
    }),
  })
}

function parseResponse(response: Response): Effect.Effect<unknown, HttpError> {
  return Effect.tryPromise({
    try: () => response.json(),
    catch: (error): HttpError => ({
      code: 500,
      message: "Unable to parse server response",
      extras: { error },
    }),
  })
}

function decodeResponse<
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

function sendHttpJSONRequest<
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
  authTokens: Option.Option<AuthTokens>,
): Effect.Effect<ResponseTo, HttpError> {
  const urlTemplate = (env.VITE_API_URL + request.path) as Path

  return pipe(
    encodeParams(urlTemplate, request, data),
    Effect.flatMap((url) => encodeQuery(url, request, data)),
    Effect.flatMap((urlWithParamsAndQuery) =>
      pipe(
        encodeJSONBody(request, data),
        Effect.flatMap((body) =>
          sendRequest("JSON", urlWithParamsAndQuery, request, body, authTokens),
        ),
        Effect.flatMap((response) =>
          pipe(
            parseResponse(response),
            Effect.flatMap((content) =>
              decodeResponse(request, response, content),
            ),
          ),
        ),
      ),
    ),
  )
}

export function sendHttpFormDataRequest<
  ParamsTo,
  Path extends string,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  BodyTo,
  BodyFrom extends Record<string, string | Blob>,
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
  authTokens: Option.Option<AuthTokens>,
): Effect.Effect<ResponseTo, HttpError> {
  const urlTemplate = (env.VITE_API_URL + request.path) as Path

  return pipe(
    encodeParams(urlTemplate, request, data),
    Effect.flatMap((url) => encodeQuery(url, request, data)),
    Effect.flatMap((urlWithParamsAndQuery) =>
      pipe(
        encodeFormDataBody(request, data),
        Effect.flatMap((body) =>
          sendRequest(
            "FormData",
            urlWithParamsAndQuery,
            request,
            body,
            authTokens,
          ),
        ),
        Effect.flatMap((response) =>
          pipe(
            parseResponse(response),
            Effect.flatMap((content) =>
              decodeResponse(request, response, content),
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
  request: Request,
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
  const [searchParams, setSearchParams] = useSearchParams(
    (() => {
      if ("query" in data && typeof request.codecs.query !== "undefined") {
        return pipe(
          populateUrlQuery("", request.codecs.query!, data.query),
          Effect.runSyncExit,
          Exit.match({
            onFailure: () => "",
            onSuccess: (query) => query.slice(1),
          }),
        )
      } else {
        return {}
      }
    })(),
  )

  const initialState = (() => {
    if ("query" in data && typeof request.codecs.query !== "undefined") {
      return pipe(
        decodeUrlQuery(request.codecs.query, searchParams),
        Effect.runSyncExit,
        Exit.map((query) => ({ ...data, query })),
        Exit.getOrElse(() => data),
      )
    } else {
      return data
    }
  })()

  const [state, setState] = useState(initialState)

  const onStateChange: Dispatch<
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
  > = (action) => {
    let mutNewState: HttpRequestData<
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

    if (typeof action === "function") {
      setState((state) => {
        const r = action(state)
        mutNewState = r
        return r
      })
    } else {
      setState(action)
      mutNewState = action
    }

    setSearchParams(() => {
      if (
        typeof mutNewState !== "undefined" &&
        "query" in mutNewState &&
        typeof request.codecs.query !== "undefined"
      ) {
        return pipe(
          populateUrlQuery("", request.codecs.query!, mutNewState.query),
          Effect.runSyncExit,
          Exit.match({
            onFailure: () => "",
            onSuccess: (query) => query.slice(1),
          }),
        )
      } else {
        return {}
      }
    })
  }

  return [state, onStateChange]
}

export function useSendHttpRequest<
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
): [
  NetworkResponse.NetworkResponse<HttpError, ResponseTo>,
  (
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
    authTokens: Option.Option<AuthTokens>,
  ) => Effect.Effect<Either.Either<HttpError, ResponseTo>>,
] {
  const [response, setResponse] = useState<
    NetworkResponse.NetworkResponse<HttpError, ResponseTo>
  >(NetworkResponse.idle())

  function sendRequest(
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
    authTokens: Option.Option<AuthTokens>,
  ): Effect.Effect<Either.Either<HttpError, ResponseTo>> {
    setResponse(
      NetworkResponse.flatMatch({
        onIdle: NetworkResponse.load(),
        onLoading: identity,
        onFailure: NetworkResponse.retry(),
        onSuccess: NetworkResponse.refresh(),
      }),
    )

    const response: Effect.Effect<Either.Either<HttpError, ResponseTo>> = pipe(
      sendHttpJSONRequest(request, data, authTokens),
      Effect.match({
        onFailure: Either.left,
        onSuccess: Either.right,
      }),
    )

    return pipe(
      response,
      Effect.map(
        Either.match({
          onLeft: (error) => {
            setResponse(
              NetworkResponse.flatMatch<
                HttpError,
                ResponseTo,
                NetworkResponse.NetworkResponse<HttpError, ResponseTo>
              >({
                onIdle: identity,
                onSuccess: identity,
                onFailure: identity,
                onLoading: (response) => {
                  console.log(error.extras)
                  return NetworkResponse.fail(error)(response)
                },
              }),
            )

            return Either.left(error)
          },
          onRight: (response) => {
            setResponse(
              NetworkResponse.flatMatch<
                HttpError,
                ResponseTo,
                NetworkResponse.NetworkResponse<HttpError, ResponseTo>
              >({
                onIdle: identity,
                onSuccess: identity,
                onFailure: identity,
                onLoading: NetworkResponse.succeed(response),
              }),
            )

            return Either.right(response)
          },
        }),
      ),
    )
  }

  return [response, sendRequest]
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
  response: NetworkResponse.NetworkResponse<HttpError, ResponseTo>,
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
  optimisticUpdate: (
    data: ResponseTo | ((previousState: ResponseTo) => ResponseTo),
  ) => void,
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
  const authContext = useAuthContext()

  const [response, setResponse] = useState<
    NetworkResponse.NetworkResponse<HttpError, ResponseTo>
  >(NetworkResponse.idle())

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
    setResponse(
      NetworkResponse.flatMatch({
        onIdle: NetworkResponse.load(),
        onLoading: identity,
        onFailure: NetworkResponse.retry(),
        onSuccess: NetworkResponse.refresh(),
      }),
    )

    Effect.runPromiseExit(
      sendHttpJSONRequest(
        request,
        data,
        (() => {
          switch (authContext.type) {
            case "Anonymous":
              return Option.none()
            case "Authenticated":
              return Option.some(authContext.authTokens)
          }
        })(),
      ),
    ).then(
      flow(
        Exit.match({
          onFailure(cause) {
            const error: HttpError = causeToHttpError(cause)

            setResponse(
              NetworkResponse.flatMatch<
                HttpError,
                ResponseTo,
                NetworkResponse.NetworkResponse<HttpError, ResponseTo>
              >({
                onIdle: identity,
                onSuccess: identity,
                onFailure: identity,
                onLoading: (response) => {
                  console.log(error.extras)
                  return NetworkResponse.fail(error)(response)
                },
              }),
            )
          },
          onSuccess(data) {
            setResponse(
              NetworkResponse.flatMatch<
                HttpError,
                ResponseTo,
                NetworkResponse.NetworkResponse<HttpError, ResponseTo>
              >({
                onIdle: identity,
                onSuccess: identity,
                onFailure: identity,
                onLoading: NetworkResponse.succeed(data),
              }),
            )
          },
        }),
      ),
    )
  }

  function update(
    update: ResponseTo | ((previousState: ResponseTo) => ResponseTo),
  ): void {
    if (typeof update === "function") {
      setResponse(
        NetworkResponse.map((previousState) =>
          (update as (previousState: ResponseTo) => ResponseTo)(previousState),
        ),
      )
    } else {
      setResponse(NetworkResponse.map(() => update))
    }
  }

  return [response, sendQuery, update]
}

type UseQueryOutput<Response> = [
  response: NetworkResponse.NetworkResponse<HttpError, Response>,
  optimisticUpdate: (
    data: Response | ((previousState: Response) => Response),
  ) => void,
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
  const authContext = useAuthContext()

  const [response, setResponse] = useState<
    NetworkResponse.NetworkResponse<HttpError, ResponseTo>
  >(NetworkResponse.idle())

  useEffect(() => {
    setResponse(
      NetworkResponse.flatMatch({
        onIdle: NetworkResponse.load(),
        onLoading: identity,
        onFailure: NetworkResponse.retry(),
        onSuccess: NetworkResponse.refresh(),
      }),
    )

    Effect.runPromiseExit(
      sendHttpJSONRequest(
        request,
        data,
        (() => {
          switch (authContext.type) {
            case "Anonymous":
              return Option.none()
            case "Authenticated":
              return Option.some(authContext.authTokens)
          }
        })(),
      ),
    ).then(
      flow(
        Exit.match({
          onFailure(cause) {
            const error: HttpError = causeToHttpError(cause)

            setResponse(
              NetworkResponse.flatMatch<
                HttpError,
                ResponseTo,
                NetworkResponse.NetworkResponse<HttpError, ResponseTo>
              >({
                onIdle: identity,
                onSuccess: identity,
                onFailure: identity,
                onLoading: (response) => {
                  console.log(error.extras)
                  return NetworkResponse.fail(error)(response)
                },
              }),
            )
          },
          onSuccess(data) {
            setResponse(
              NetworkResponse.flatMatch<
                HttpError,
                ResponseTo,
                NetworkResponse.NetworkResponse<HttpError, ResponseTo>
              >({
                onIdle: identity,
                onSuccess: identity,
                onFailure: identity,
                onLoading: NetworkResponse.succeed(data),
              }),
            )
          },
        }),
      ),
    )
  }, [request, data, authContext])

  function update(
    update: ResponseTo | ((previousState: ResponseTo) => ResponseTo),
  ): void {
    if (typeof update === "function") {
      setResponse(
        NetworkResponse.map((previousState) =>
          (update as (previousState: ResponseTo) => ResponseTo)(previousState),
        ),
      )
    } else {
      setResponse(NetworkResponse.map(() => update))
    }
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
  response: NetworkResponse.NetworkResponse<HttpError, ResponseTo>,
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
  const authContext = useAuthContext()

  const [response, setResponse] = useState<
    NetworkResponse.NetworkResponse<HttpError, ResponseTo>
  >(NetworkResponse.idle())

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
    setResponse(
      NetworkResponse.flatMatch({
        onIdle: NetworkResponse.load(),
        onLoading: identity,
        onFailure: NetworkResponse.retry(),
        onSuccess: NetworkResponse.refresh(),
      }),
    )

    return Effect.runPromiseExit(
      sendHttpJSONRequest(
        request,
        data,
        (() => {
          switch (authContext.type) {
            case "Anonymous":
              return Option.none()
            case "Authenticated":
              return Option.some(authContext.authTokens)
          }
        })(),
      ),
    ).then(
      flow(
        Exit.match({
          onFailure(cause) {
            const error: HttpError = causeToHttpError(cause)

            setResponse(
              NetworkResponse.flatMatch<
                HttpError,
                ResponseTo,
                NetworkResponse.NetworkResponse<HttpError, ResponseTo>
              >({
                onIdle: identity,
                onSuccess: identity,
                onFailure: identity,
                onLoading: (response) => {
                  console.log(error.extras)
                  return NetworkResponse.fail(error)(response)
                },
              }),
            )

            return Either.left(error)
          },
          onSuccess(data) {
            setResponse(
              NetworkResponse.flatMatch<
                HttpError,
                ResponseTo,
                NetworkResponse.NetworkResponse<HttpError, ResponseTo>
              >({
                onIdle: identity,
                onSuccess: identity,
                onFailure: identity,
                onLoading: NetworkResponse.succeed(data),
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

type UseFormDataCommandOutput<
  ParamsTo,
  Path extends string,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  BodyTo,
  BodyFrom extends Record<string, string | Blob>,
  ResponseTo,
  ResponseFrom,
> = [
  response: NetworkResponse.NetworkResponse<HttpError, ResponseTo>,
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

export function useFormDataCommand<
  ParamsTo,
  Path extends string,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  BodyTo,
  BodyFrom extends Record<string, string | Blob>,
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
): UseFormDataCommandOutput<
  ParamsTo,
  Path,
  QueryTo,
  QueryFrom,
  BodyTo,
  BodyFrom,
  ResponseTo,
  ResponseFrom
> {
  const authContext = useAuthContext()

  const [response, setResponse] = useState<
    NetworkResponse.NetworkResponse<HttpError, ResponseTo>
  >(NetworkResponse.idle())

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
    setResponse(
      NetworkResponse.flatMatch({
        onIdle: NetworkResponse.load(),
        onLoading: identity,
        onFailure: NetworkResponse.retry(),
        onSuccess: NetworkResponse.refresh(),
      }),
    )

    return Effect.runPromiseExit(
      sendHttpFormDataRequest(
        request,
        data,
        (() => {
          switch (authContext.type) {
            case "Anonymous":
              return Option.none()
            case "Authenticated":
              return Option.some(authContext.authTokens)
          }
        })(),
      ),
    ).then(
      flow(
        Exit.match({
          onFailure(cause) {
            const error: HttpError = causeToHttpError(cause)

            setResponse(
              NetworkResponse.flatMatch<
                HttpError,
                ResponseTo,
                NetworkResponse.NetworkResponse<HttpError, ResponseTo>
              >({
                onIdle: identity,
                onSuccess: identity,
                onFailure: identity,
                onLoading: (response) => {
                  console.log(error.extras)
                  return NetworkResponse.fail(error)(response)
                },
              }),
            )

            return Either.left(error)
          },
          onSuccess(data) {
            setResponse(
              NetworkResponse.flatMatch<
                HttpError,
                ResponseTo,
                NetworkResponse.NetworkResponse<HttpError, ResponseTo>
              >({
                onIdle: identity,
                onSuccess: identity,
                onFailure: identity,
                onLoading: NetworkResponse.succeed(data),
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
