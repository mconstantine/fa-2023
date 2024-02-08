import * as S from "@effect/schema/Schema"
import { Option, pipe } from "effect"
import express, { type Request } from "express"
import { type RouteParameters } from "express-serve-static-core"
import { HttpError } from "./HttpError"
import { handleError } from "./handleError"

interface RouteCodecs<
  ParamsFrom extends Record<string, string | undefined>,
  ParamsTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  QueryTo,
  BodyFrom,
  BodyTo,
> {
  params?: S.Schema<never, ParamsFrom, ParamsTo>
  query?: S.Schema<never, QueryFrom, QueryTo>
  body?: S.Schema<never, BodyFrom, BodyTo>
}

interface RouteHandlerData<
  ParamsFrom extends Record<string, string | undefined>,
  ParamsTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  QueryTo,
  BodyFrom,
  BodyTo,
  Codecs extends RouteCodecs<
    ParamsFrom,
    ParamsTo,
    QueryFrom,
    QueryTo,
    BodyFrom,
    BodyTo
  >,
> {
  query: Codecs["query"] extends undefined ? never : QueryTo
  params: Codecs["params"] extends undefined ? never : ParamsTo
  body: Codecs["body"] extends undefined ? never : BodyTo
}

type ResponseType = Record<string, unknown>

interface Route<
  ParamsFrom extends Record<string, string | undefined>,
  ParamsTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  QueryTo,
  BodyFrom,
  BodyTo,
  Codecs extends RouteCodecs<
    ParamsFrom,
    ParamsTo,
    QueryFrom,
    QueryTo,
    BodyFrom,
    BodyTo
  >,
  Response extends Record<string, unknown> | readonly ResponseType[],
> {
  codecs: Codecs
  handler: (
    data: RouteHandlerData<
      ParamsFrom,
      ParamsTo,
      QueryFrom,
      QueryTo,
      BodyFrom,
      BodyTo,
      Codecs
    >,
  ) => Promise<Response>
}

export class Router {
  private readonly router: express.Router

  private constructor(router: express.Router) {
    this.router = router
  }

  public toExpressRouter(): express.Router {
    return this.router
  }

  static get<
    Path extends string,
    ParamsTo,
    QueryFrom extends Record<string, string | readonly string[] | undefined>,
    QueryTo,
    Response extends Record<string, unknown> | readonly ResponseType[],
  >(
    path: Path,
    route: Route<
      RouteParameters<Path>,
      ParamsTo,
      QueryFrom,
      QueryTo,
      never,
      never,
      RouteCodecs<
        RouteParameters<Path>,
        ParamsTo,
        QueryFrom,
        QueryTo,
        never,
        never
      >,
      Response
    >,
  ): Router {
    return new Router(express.Router()).get(path, route)
  }

  static post<
    Path extends string,
    ParamsTo,
    QueryFrom extends Record<string, string | readonly string[] | undefined>,
    QueryTo,
    BodyFrom,
    BodyTo,
    Response extends Record<string, unknown> | readonly ResponseType[],
  >(
    path: Path,
    route: Route<
      RouteParameters<Path>,
      ParamsTo,
      QueryFrom,
      QueryTo,
      BodyFrom,
      BodyTo,
      RouteCodecs<
        RouteParameters<Path>,
        ParamsTo,
        QueryFrom,
        QueryTo,
        BodyFrom,
        BodyTo
      >,
      Response
    >,
  ): Router {
    return new Router(express.Router()).post(path, route)
  }

  static patch<
    Path extends string,
    ParamsTo,
    QueryFrom extends Record<string, string | readonly string[] | undefined>,
    QueryTo,
    BodyFrom,
    BodyTo,
    Response extends Record<string, unknown> | readonly ResponseType[],
  >(
    path: Path,
    route: Route<
      RouteParameters<Path>,
      ParamsTo,
      QueryFrom,
      QueryTo,
      BodyFrom,
      BodyTo,
      RouteCodecs<
        RouteParameters<Path>,
        ParamsTo,
        QueryFrom,
        QueryTo,
        BodyFrom,
        BodyTo
      >,
      Response
    >,
  ): Router {
    return new Router(express.Router()).patch(path, route)
  }

  static put<
    Path extends string,
    ParamsTo,
    QueryFrom extends Record<string, string | readonly string[] | undefined>,
    QueryTo,
    BodyFrom,
    BodyTo,
    Response extends Record<string, unknown> | readonly ResponseType[],
  >(
    path: Path,
    route: Route<
      RouteParameters<Path>,
      ParamsTo,
      QueryFrom,
      QueryTo,
      BodyFrom,
      BodyTo,
      RouteCodecs<
        RouteParameters<Path>,
        ParamsTo,
        QueryFrom,
        QueryTo,
        BodyFrom,
        BodyTo
      >,
      Response
    >,
  ): Router {
    return new Router(express.Router()).put(path, route)
  }

  static delete<
    Path extends string,
    ParamsTo,
    QueryFrom extends Record<string, string | readonly string[] | undefined>,
    QueryTo,
    Response extends Record<string, unknown> | readonly ResponseType[],
  >(
    path: Path,
    route: Route<
      RouteParameters<Path>,
      ParamsTo,
      QueryFrom,
      QueryTo,
      never,
      never,
      RouteCodecs<
        RouteParameters<Path>,
        ParamsTo,
        QueryFrom,
        QueryTo,
        never,
        never
      >,
      Response
    >,
  ): Router {
    return new Router(express.Router()).delete(path, route)
  }

  public get<
    Path extends string,
    ParamsTo,
    QueryFrom extends Record<string, string | readonly string[] | undefined>,
    QueryTo,
    Response extends Record<string, unknown> | readonly ResponseType[],
  >(
    path: Path,
    route: Route<
      RouteParameters<Path>,
      ParamsTo,
      QueryFrom,
      QueryTo,
      never,
      never,
      RouteCodecs<
        RouteParameters<Path>,
        ParamsTo,
        QueryFrom,
        QueryTo,
        never,
        never
      >,
      Response
    >,
  ): Router {
    return new Router(
      this.router.get<
        Path,
        RouteParameters<Path>,
        Response,
        never,
        QueryFrom,
        never
      >(path, this.handle(route)),
    )
  }

  public post<
    Path extends string,
    ParamsTo,
    QueryFrom extends Record<string, string | readonly string[] | undefined>,
    QueryTo,
    BodyFrom,
    BodyTo,
    Response extends Record<string, unknown> | readonly ResponseType[],
  >(
    path: Path,
    route: Route<
      RouteParameters<Path>,
      ParamsTo,
      QueryFrom,
      QueryTo,
      BodyFrom,
      BodyTo,
      RouteCodecs<
        RouteParameters<Path>,
        ParamsTo,
        QueryFrom,
        QueryTo,
        BodyFrom,
        BodyTo
      >,
      Response
    >,
  ): Router {
    return new Router(
      this.router.post<
        Path,
        RouteParameters<Path>,
        Response,
        never,
        QueryFrom,
        never
      >(path, this.handle(route)),
    )
  }

  public patch<
    Path extends string,
    ParamsTo,
    QueryFrom extends Record<string, string | readonly string[] | undefined>,
    QueryTo,
    BodyFrom,
    BodyTo,
    Response extends Record<string, unknown> | readonly ResponseType[],
  >(
    path: Path,
    route: Route<
      RouteParameters<Path>,
      ParamsTo,
      QueryFrom,
      QueryTo,
      BodyFrom,
      BodyTo,
      RouteCodecs<
        RouteParameters<Path>,
        ParamsTo,
        QueryFrom,
        QueryTo,
        BodyFrom,
        BodyTo
      >,
      Response
    >,
  ): Router {
    return new Router(
      this.router.patch<
        Path,
        RouteParameters<Path>,
        Response,
        never,
        QueryFrom,
        never
      >(path, this.handle(route)),
    )
  }

  public put<
    Path extends string,
    ParamsTo,
    QueryFrom extends Record<string, string | readonly string[] | undefined>,
    QueryTo,
    BodyFrom,
    BodyTo,
    Response extends Record<string, unknown> | readonly ResponseType[],
  >(
    path: Path,
    route: Route<
      RouteParameters<Path>,
      ParamsTo,
      QueryFrom,
      QueryTo,
      BodyFrom,
      BodyTo,
      RouteCodecs<
        RouteParameters<Path>,
        ParamsTo,
        QueryFrom,
        QueryTo,
        BodyFrom,
        BodyTo
      >,
      Response
    >,
  ): Router {
    return new Router(
      this.router.put<
        Path,
        RouteParameters<Path>,
        Response,
        never,
        QueryFrom,
        never
      >(path, this.handle(route)),
    )
  }

  public delete<
    Path extends string,
    ParamsTo,
    QueryFrom extends Record<string, string | readonly string[] | undefined>,
    QueryTo,
    Response extends Record<string, unknown> | readonly ResponseType[],
  >(
    path: Path,
    route: Route<
      RouteParameters<Path>,
      ParamsTo,
      QueryFrom,
      QueryTo,
      never,
      never,
      RouteCodecs<
        RouteParameters<Path>,
        ParamsTo,
        QueryFrom,
        QueryTo,
        never,
        never
      >,
      Response
    >,
  ): Router {
    return new Router(
      this.router.delete<
        Path,
        RouteParameters<Path>,
        Response,
        never,
        QueryFrom,
        never
      >(path, this.handle(route)),
    )
  }

  private handle<
    Path extends string,
    ParamsTo,
    QueryFrom extends Record<string, string | readonly string[] | undefined>,
    QueryTo,
    BodyFrom,
    BodyTo,
    Response extends Record<string, unknown> | readonly ResponseType[],
  >(
    route: Route<
      RouteParameters<Path>,
      ParamsTo,
      QueryFrom,
      QueryTo,
      BodyFrom,
      BodyTo,
      RouteCodecs<
        RouteParameters<Path>,
        ParamsTo,
        QueryFrom,
        QueryTo,
        BodyFrom,
        BodyTo
      >,
      Response
    >,
  ) {
    return (
      req: Request<RouteParameters<Path>, Response, BodyFrom, QueryFrom, never>,
      res: express.Response<Response, never>,
    ) => {
      ;(async () => {
        try {
          const params = pipe(
            Option.fromNullable(route.codecs.params),
            Option.map((codec) => {
              try {
                return S.decodeUnknownSync(codec)(req.params)
              } catch (e) {
                throw new HttpError(400, (e as Error).message)
              }
            }),
            Option.getOrUndefined,
          )

          const query = pipe(
            Option.fromNullable(route.codecs.query),
            Option.map((codec) => {
              try {
                return S.decodeSync(codec)(req.query)
              } catch (e) {
                throw new HttpError(400, (e as Error).message)
              }
            }),
            Option.getOrUndefined,
          )

          const body = pipe(
            Option.fromNullable(route.codecs.body),
            Option.map((codec) => {
              try {
                return S.decodeSync(codec)(req.body)
              } catch (e) {
                throw new HttpError(400, (e as Error).message)
              }
            }),
            Option.getOrUndefined,
          )

          const result = await route.handler({
            params: params as ParamsTo,
            query: query as QueryTo,
            body: body as BodyTo,
          })

          res.json(result).end()
        } catch (e) {
          handleError(e, res)
        }
      })().then(
        () => {},
        () => {},
      )
    }
  }
}
