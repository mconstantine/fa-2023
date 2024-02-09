import * as S from "@effect/schema/Schema"
import { Option, pipe } from "effect"
import express, { type Request } from "express"
import { type RouteParameters } from "express-serve-static-core"
import { HttpError } from "./HttpError"
import { handleError } from "./handleError"

interface RouteCodecs<
  ParamsTo,
  ParamsFrom extends Record<string, string | undefined>,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  BodyTo,
  BodyFrom,
> {
  params?: S.Schema<ParamsTo, ParamsFrom>
  query?: S.Schema<QueryTo, QueryFrom>
  body?: S.Schema<BodyTo, BodyFrom>
}

interface RouteHandlerData<
  ParamsTo,
  ParamsFrom extends Record<string, string | undefined>,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  BodyTo,
  BodyFrom,
  Codecs extends RouteCodecs<
    ParamsTo,
    ParamsFrom,
    QueryTo,
    QueryFrom,
    BodyTo,
    BodyFrom
  >,
> {
  query: Codecs["query"] extends undefined ? never : QueryTo
  params: Codecs["params"] extends undefined ? never : ParamsTo
  body: Codecs["body"] extends undefined ? never : BodyTo
}

type ResponseType = Record<string, unknown>

interface Route<
  ParamsTo,
  ParamsFrom extends Record<string, string | undefined>,
  QueryTo,
  QueryFrom extends Record<string, string | readonly string[] | undefined>,
  BodyTo,
  BodyFrom,
  Codecs extends RouteCodecs<
    ParamsTo,
    ParamsFrom,
    QueryTo,
    QueryFrom,
    BodyTo,
    BodyFrom
  >,
  Response extends Record<string, unknown> | readonly ResponseType[],
> {
  codecs: Codecs
  handler: (
    data: RouteHandlerData<
      ParamsTo,
      ParamsFrom,
      QueryTo,
      QueryFrom,
      BodyTo,
      BodyFrom,
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
    ParamsTo,
    Path extends string,
    QueryTo,
    QueryFrom extends Record<string, string | readonly string[] | undefined>,
    Response extends Record<string, unknown> | readonly ResponseType[],
  >(
    path: Path,
    route: Route<
      ParamsTo,
      RouteParameters<Path>,
      QueryTo,
      QueryFrom,
      never,
      never,
      RouteCodecs<
        ParamsTo,
        RouteParameters<Path>,
        QueryTo,
        QueryFrom,
        never,
        never
      >,
      Response
    >,
  ): Router {
    return new Router(express.Router()).get(path, route)
  }

  static post<
    ParamsTo,
    Path extends string,
    QueryTo,
    QueryFrom extends Record<string, string | readonly string[] | undefined>,
    BodyTo,
    BodyFrom,
    Response extends Record<string, unknown> | readonly ResponseType[],
  >(
    path: Path,
    route: Route<
      ParamsTo,
      RouteParameters<Path>,
      QueryTo,
      QueryFrom,
      BodyTo,
      BodyFrom,
      RouteCodecs<
        ParamsTo,
        RouteParameters<Path>,
        QueryTo,
        QueryFrom,
        BodyTo,
        BodyFrom
      >,
      Response
    >,
  ): Router {
    return new Router(express.Router()).post(path, route)
  }

  static patch<
    ParamsTo,
    Path extends string,
    QueryTo,
    QueryFrom extends Record<string, string | readonly string[] | undefined>,
    BodyTo,
    BodyFrom,
    Response extends Record<string, unknown> | readonly ResponseType[],
  >(
    path: Path,
    route: Route<
      ParamsTo,
      RouteParameters<Path>,
      QueryTo,
      QueryFrom,
      BodyTo,
      BodyFrom,
      RouteCodecs<
        ParamsTo,
        RouteParameters<Path>,
        QueryTo,
        QueryFrom,
        BodyTo,
        BodyFrom
      >,
      Response
    >,
  ): Router {
    return new Router(express.Router()).patch(path, route)
  }

  static put<
    ParamsTo,
    Path extends string,
    QueryTo,
    QueryFrom extends Record<string, string | readonly string[] | undefined>,
    BodyTo,
    BodyFrom,
    Response extends Record<string, unknown> | readonly ResponseType[],
  >(
    path: Path,
    route: Route<
      ParamsTo,
      RouteParameters<Path>,
      QueryTo,
      QueryFrom,
      BodyTo,
      BodyFrom,
      RouteCodecs<
        ParamsTo,
        RouteParameters<Path>,
        QueryTo,
        QueryFrom,
        BodyTo,
        BodyFrom
      >,
      Response
    >,
  ): Router {
    return new Router(express.Router()).put(path, route)
  }

  static delete<
    ParamsTo,
    Path extends string,
    QueryTo,
    QueryFrom extends Record<string, string | readonly string[] | undefined>,
    Response extends Record<string, unknown> | readonly ResponseType[],
  >(
    path: Path,
    route: Route<
      ParamsTo,
      RouteParameters<Path>,
      QueryTo,
      QueryFrom,
      never,
      never,
      RouteCodecs<
        ParamsTo,
        RouteParameters<Path>,
        QueryTo,
        QueryFrom,
        never,
        never
      >,
      Response
    >,
  ): Router {
    return new Router(express.Router()).delete(path, route)
  }

  public get<
    ParamsTo,
    Path extends string,
    QueryTo,
    QueryFrom extends Record<string, string | readonly string[] | undefined>,
    Response extends Record<string, unknown> | readonly ResponseType[],
  >(
    path: Path,
    route: Route<
      ParamsTo,
      RouteParameters<Path>,
      QueryTo,
      QueryFrom,
      never,
      never,
      RouteCodecs<
        ParamsTo,
        RouteParameters<Path>,
        QueryTo,
        QueryFrom,
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
    ParamsTo,
    Path extends string,
    QueryTo,
    QueryFrom extends Record<string, string | readonly string[] | undefined>,
    BodyTo,
    BodyFrom,
    Response extends Record<string, unknown> | readonly ResponseType[],
  >(
    path: Path,
    route: Route<
      ParamsTo,
      RouteParameters<Path>,
      QueryTo,
      QueryFrom,
      BodyTo,
      BodyFrom,
      RouteCodecs<
        ParamsTo,
        RouteParameters<Path>,
        QueryTo,
        QueryFrom,
        BodyTo,
        BodyFrom
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
    ParamsTo,
    Path extends string,
    QueryTo,
    QueryFrom extends Record<string, string | readonly string[] | undefined>,
    BodyTo,
    BodyFrom,
    Response extends Record<string, unknown> | readonly ResponseType[],
  >(
    path: Path,
    route: Route<
      ParamsTo,
      RouteParameters<Path>,
      QueryTo,
      QueryFrom,
      BodyTo,
      BodyFrom,
      RouteCodecs<
        ParamsTo,
        RouteParameters<Path>,
        QueryTo,
        QueryFrom,
        BodyTo,
        BodyFrom
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
    ParamsTo,
    Path extends string,
    QueryTo,
    QueryFrom extends Record<string, string | readonly string[] | undefined>,
    BodyTo,
    BodyFrom,
    Response extends Record<string, unknown> | readonly ResponseType[],
  >(
    path: Path,
    route: Route<
      ParamsTo,
      RouteParameters<Path>,
      QueryTo,
      QueryFrom,
      BodyTo,
      BodyFrom,
      RouteCodecs<
        ParamsTo,
        RouteParameters<Path>,
        QueryTo,
        QueryFrom,
        BodyTo,
        BodyFrom
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
    ParamsTo,
    Path extends string,
    QueryTo,
    QueryFrom extends Record<string, string | readonly string[] | undefined>,
    Response extends Record<string, unknown> | readonly ResponseType[],
  >(
    path: Path,
    route: Route<
      ParamsTo,
      RouteParameters<Path>,
      QueryTo,
      QueryFrom,
      never,
      never,
      RouteCodecs<
        ParamsTo,
        RouteParameters<Path>,
        QueryTo,
        QueryFrom,
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
    ParamsTo,
    Path extends string,
    QueryTo,
    QueryFrom extends Record<string, string | readonly string[] | undefined>,
    BodyTo,
    BodyFrom,
    Response extends Record<string, unknown> | readonly ResponseType[],
  >(
    route: Route<
      ParamsTo,
      RouteParameters<Path>,
      QueryTo,
      QueryFrom,
      BodyTo,
      BodyFrom,
      RouteCodecs<
        ParamsTo,
        RouteParameters<Path>,
        QueryTo,
        QueryFrom,
        BodyTo,
        BodyFrom
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
