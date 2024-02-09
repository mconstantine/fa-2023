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
  ParamsTo,
  ParamsFrom extends Record<string, string | undefined>,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  BodyTo,
  BodyFrom,
  ResponseTo,
  ResponseFrom,
> {
  params?: S.Schema<ParamsTo, ParamsFrom>
  query?: S.Schema<QueryTo, QueryFrom>
  body?: S.Schema<BodyTo, BodyFrom>
  response: S.Schema<ResponseTo, ResponseFrom>
}

export interface HttpRequest<
  ParamsTo,
  Path extends string,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  BodyTo,
  BodyFrom,
  ResponseTo,
  ResponseFrom,
> {
  path: Path
  method: HttpMethod
  codecs: HttpRequestCodecs<
    ParamsTo,
    RouteParameters<Path>,
    QueryTo,
    QueryFrom,
    BodyTo,
    BodyFrom,
    ResponseTo,
    ResponseFrom
  >
}

export interface HttpGetRequest<
  ParamsTo,
  Path extends string,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  ResponseTo,
  ResponseFrom,
> extends HttpRequest<
    ParamsTo,
    Path,
    QueryTo,
    QueryFrom,
    never,
    never,
    ResponseTo,
    ResponseFrom
  > {
  method: "GET"
}

export interface HttpPostRequest<
  ParamsTo,
  Path extends string,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  BodyTo,
  BodyFrom,
  ResponseTo,
  ResponseFrom,
> extends HttpRequest<
    ParamsTo,
    Path,
    QueryTo,
    QueryFrom,
    BodyTo,
    BodyFrom,
    ResponseTo,
    ResponseFrom
  > {
  method: "POST"
}

export interface HttpPutRequest<
  ParamsTo,
  Path extends string,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  BodyTo,
  BodyFrom,
  ResponseTo,
  ResponseFrom,
> extends HttpRequest<
    ParamsTo,
    Path,
    QueryTo,
    QueryFrom,
    BodyTo,
    BodyFrom,
    ResponseTo,
    ResponseFrom
  > {
  method: "PUT"
}

export interface HttpPatchRequest<
  ParamsTo,
  Path extends string,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  BodyTo,
  BodyFrom,
  ResponseTo,
  ResponseFrom,
> extends HttpRequest<
    ParamsTo,
    Path,
    QueryTo,
    QueryFrom,
    BodyTo,
    BodyFrom,
    ResponseTo,
    ResponseFrom
  > {
  method: "PATCH"
}

export interface HttpDeleteRequest<
  ParamsTo,
  Path extends string,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  ResponseTo,
  ResponseFrom,
> extends HttpRequest<
    ParamsTo,
    Path,
    QueryTo,
    QueryFrom,
    never,
    never,
    ResponseTo,
    ResponseFrom
  > {
  method: "DELETE"
}

export function makeGet<
  ParamsTo,
  Path extends string,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  ResponseTo,
  ResponseFrom,
>(
  path: Path,
  codecs: HttpRequestCodecs<
    ParamsTo,
    RouteParameters<Path>,
    QueryTo,
    QueryFrom,
    never,
    never,
    ResponseTo,
    ResponseFrom
  >,
): HttpGetRequest<
  ParamsTo,
  Path,
  QueryTo,
  QueryFrom,
  ResponseTo,
  ResponseFrom
> {
  return { path, method: "GET", codecs }
}

export function makePost<
  ParamsTo,
  Path extends string,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  BodyTo,
  BodyFrom,
  ResponseTo,
  ResponseFrom,
>(
  path: Path,
  codecs: HttpRequestCodecs<
    ParamsTo,
    RouteParameters<Path>,
    QueryTo,
    QueryFrom,
    BodyTo,
    BodyFrom,
    ResponseTo,
    ResponseFrom
  >,
): HttpPostRequest<
  ParamsTo,
  Path,
  QueryTo,
  QueryFrom,
  BodyTo,
  BodyFrom,
  ResponseTo,
  ResponseFrom
> {
  return { path, method: "POST", codecs }
}

export function makePut<
  ParamsTo,
  Path extends string,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  BodyTo,
  BodyFrom,
  ResponseTo,
  ResponseFrom,
>(
  path: Path,
  codecs: HttpRequestCodecs<
    ParamsTo,
    RouteParameters<Path>,
    QueryTo,
    QueryFrom,
    BodyTo,
    BodyFrom,
    ResponseTo,
    ResponseFrom
  >,
): HttpPutRequest<
  ParamsTo,
  Path,
  QueryTo,
  QueryFrom,
  BodyTo,
  BodyFrom,
  ResponseTo,
  ResponseFrom
> {
  return { path, method: "PUT", codecs }
}

export function makePatch<
  ParamsTo,
  Path extends string,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  BodyTo,
  BodyFrom,
  ResponseTo,
  ResponseFrom,
>(
  path: Path,
  codecs: HttpRequestCodecs<
    ParamsTo,
    RouteParameters<Path>,
    QueryTo,
    QueryFrom,
    BodyTo,
    BodyFrom,
    ResponseTo,
    ResponseFrom
  >,
): HttpPatchRequest<
  ParamsTo,
  Path,
  QueryTo,
  QueryFrom,
  BodyTo,
  BodyFrom,
  ResponseTo,
  ResponseFrom
> {
  return { path, method: "PATCH", codecs }
}

export function makeDelete<
  ParamsTo,
  Path extends string,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  ResponseTo,
  ResponseFrom,
>(
  path: Path,
  codecs: HttpRequestCodecs<
    ParamsTo,
    RouteParameters<Path>,
    QueryTo,
    QueryFrom,
    never,
    never,
    ResponseTo,
    ResponseFrom
  >,
): HttpDeleteRequest<
  ParamsTo,
  Path,
  QueryTo,
  QueryFrom,
  ResponseTo,
  ResponseFrom
> {
  return { path, method: "DELETE", codecs }
}
