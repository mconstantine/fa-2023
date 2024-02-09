import * as S from "@effect/schema/Schema"

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE"

type GetRouteParameter<S extends string> = S extends `${infer P}/${string}`
  ? P
  : S

export type RouteParameters<Route extends string> =
  Route extends `${string}:${infer Rest}`
    ? (GetRouteParameter<Rest> extends never
        ? Record<string, never>
        : { readonly [P in GetRouteParameter<Rest>]: string }) &
        (Rest extends `${GetRouteParameter<Rest>}${infer Next}`
          ? RouteParameters<Next>
          : unknown)
    : // eslint-disable-next-line @typescript-eslint/ban-types
      {}

interface HttpRequestCodecs<
  ParamsFrom extends Record<string, string | undefined>,
  ParamsTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  QueryTo,
  BodyFrom,
  BodyTo,
  ResponseFrom,
  ResponseTo,
> {
  params?: S.Schema<never, ParamsFrom, ParamsTo>
  query?: S.Schema<never, QueryFrom, QueryTo>
  body?: S.Schema<never, BodyFrom, BodyTo>
  response: S.Schema<never, ResponseFrom, ResponseTo>
}

export interface HttpRequest<
  Path extends string,
  ParamsTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  QueryTo,
  BodyFrom,
  BodyTo,
  ResponseFrom,
  ResponseTo,
> {
  path: Path
  method: HttpMethod
  codecs: HttpRequestCodecs<
    RouteParameters<Path>,
    ParamsTo,
    QueryFrom,
    QueryTo,
    BodyFrom,
    BodyTo,
    ResponseFrom,
    ResponseTo
  >
}

export interface HttpGetRequest<
  Path extends string,
  ParamsTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  QueryTo,
  ResponseFrom,
  ResponseTo,
> extends HttpRequest<
    Path,
    ParamsTo,
    QueryFrom,
    QueryTo,
    never,
    never,
    ResponseFrom,
    ResponseTo
  > {
  method: "GET"
}

export interface HttpPostRequest<
  Path extends string,
  ParamsTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  QueryTo,
  BodyFrom,
  BodyTo,
  ResponseFrom,
  ResponseTo,
> extends HttpRequest<
    Path,
    ParamsTo,
    QueryFrom,
    QueryTo,
    BodyFrom,
    BodyTo,
    ResponseFrom,
    ResponseTo
  > {
  method: "POST"
}

export interface HttpPutRequest<
  Path extends string,
  ParamsTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  QueryTo,
  BodyFrom,
  BodyTo,
  ResponseFrom,
  ResponseTo,
> extends HttpRequest<
    Path,
    ParamsTo,
    QueryFrom,
    QueryTo,
    BodyFrom,
    BodyTo,
    ResponseFrom,
    ResponseTo
  > {
  method: "PUT"
}

export interface HttpPatchRequest<
  Path extends string,
  ParamsTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  QueryTo,
  BodyFrom,
  BodyTo,
  ResponseFrom,
  ResponseTo,
> extends HttpRequest<
    Path,
    ParamsTo,
    QueryFrom,
    QueryTo,
    BodyFrom,
    BodyTo,
    ResponseFrom,
    ResponseTo
  > {
  method: "PATCH"
}

export interface HttpDeleteRequest<
  Path extends string,
  ParamsTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  QueryTo,
  ResponseFrom,
  ResponseTo,
> extends HttpRequest<
    Path,
    ParamsTo,
    QueryFrom,
    QueryTo,
    never,
    never,
    ResponseFrom,
    ResponseTo
  > {
  method: "DELETE"
}

export function makeGet<
  Path extends string,
  ParamsTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  QueryTo,
  ResponseFrom,
  ResponseTo,
>(
  path: Path,
  codecs: HttpRequestCodecs<
    RouteParameters<Path>,
    ParamsTo,
    QueryFrom,
    QueryTo,
    never,
    never,
    ResponseFrom,
    ResponseTo
  >,
): HttpGetRequest<
  Path,
  ParamsTo,
  QueryFrom,
  QueryTo,
  ResponseFrom,
  ResponseTo
> {
  return { path, method: "GET", codecs }
}

export function makePost<
  Path extends string,
  ParamsTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  QueryTo,
  BodyFrom,
  BodyTo,
  ResponseFrom,
  ResponseTo,
>(
  path: Path,
  codecs: HttpRequestCodecs<
    RouteParameters<Path>,
    ParamsTo,
    QueryFrom,
    QueryTo,
    BodyFrom,
    BodyTo,
    ResponseFrom,
    ResponseTo
  >,
): HttpPostRequest<
  Path,
  ParamsTo,
  QueryFrom,
  QueryTo,
  BodyFrom,
  BodyTo,
  ResponseFrom,
  ResponseTo
> {
  return { path, method: "POST", codecs }
}

export function makePut<
  Path extends string,
  ParamsTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  QueryTo,
  BodyFrom,
  BodyTo,
  ResponseFrom,
  ResponseTo,
>(
  path: Path,
  codecs: HttpRequestCodecs<
    RouteParameters<Path>,
    ParamsTo,
    QueryFrom,
    QueryTo,
    BodyFrom,
    BodyTo,
    ResponseFrom,
    ResponseTo
  >,
): HttpPutRequest<
  Path,
  ParamsTo,
  QueryFrom,
  QueryTo,
  BodyFrom,
  BodyTo,
  ResponseFrom,
  ResponseTo
> {
  return { path, method: "PUT", codecs }
}

export function makePatch<
  Path extends string,
  ParamsTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  QueryTo,
  BodyFrom,
  BodyTo,
  ResponseFrom,
  ResponseTo,
>(
  path: Path,
  codecs: HttpRequestCodecs<
    RouteParameters<Path>,
    ParamsTo,
    QueryFrom,
    QueryTo,
    BodyFrom,
    BodyTo,
    ResponseFrom,
    ResponseTo
  >,
): HttpPatchRequest<
  Path,
  ParamsTo,
  QueryFrom,
  QueryTo,
  BodyFrom,
  BodyTo,
  ResponseFrom,
  ResponseTo
> {
  return { path, method: "PATCH", codecs }
}

export function makeDelete<
  Path extends string,
  ParamsTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  QueryTo,
  ResponseFrom,
  ResponseTo,
>(
  path: Path,
  codecs: HttpRequestCodecs<
    RouteParameters<Path>,
    ParamsTo,
    QueryFrom,
    QueryTo,
    never,
    never,
    ResponseFrom,
    ResponseTo
  >,
): HttpDeleteRequest<
  Path,
  ParamsTo,
  QueryFrom,
  QueryTo,
  ResponseFrom,
  ResponseTo
> {
  return { path, method: "DELETE", codecs }
}
