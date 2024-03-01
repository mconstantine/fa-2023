import * as S from "@effect/schema/Schema"
import { Effect, Exit, Option, pipe } from "effect"
import express, { type Request } from "express"
import { type RouteParameters } from "express-serve-static-core"
import { HttpError } from "./HttpError"
import { handleError } from "./handleError"
import { constVoid } from "effect/Function"

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
  Locals extends Record<string, unknown>,
> {
  query: Codecs["query"] extends undefined ? never : QueryTo
  params: Codecs["params"] extends undefined ? never : ParamsTo
  body: Codecs["body"] extends undefined ? never : BodyTo
  locals: Locals
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
  Locals extends Record<string, never>,
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
      Codecs,
      Locals
    >,
  ) => Promise<Response>
}

export class Router<Locals extends Record<string, never>> {
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
      Response,
      Record<string, never>
    >,
  ): Router<Record<string, never>> {
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
      Response,
      Record<string, never>
    >,
  ): Router<Record<string, never>> {
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
      Response,
      Record<string, never>
    >,
  ): Router<Record<string, never>> {
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
      Response,
      Record<string, never>
    >,
  ): Router<Record<string, never>> {
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
      Response,
      Record<string, never>
    >,
  ): Router<Record<string, never>> {
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
      Response,
      Locals
    >,
  ): Router<Locals> {
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
      Response,
      Locals
    >,
  ): Router<Locals> {
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
      Response,
      Locals
    >,
  ): Router<Locals> {
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
      Response,
      Locals
    >,
  ): Router<Locals> {
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
      Response,
      Locals
    >,
  ): Router<Locals> {
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

  public tap(fn: (router: express.Router) => express.Router): Router<Locals> {
    return new Router(fn(this.router))
  }

  public withMiddleware<L extends Record<string, unknown>>(
    middleware: (
      req: Request<Record<string, never>, never, never, never, Locals>,
    ) => Effect.Effect<L, HttpError>,
  ): Router<Locals & { [key in keyof L]: L[key] }> {
    return new Router(
      this.router.use(
        (
          req: Request<Record<string, never>, never, never, never, Locals>,
          res,
          next,
        ) => {
          ;(async () => {
            const result = await Effect.runPromiseExit(middleware(req))

            pipe(
              result,
              Exit.match({
                onFailure: (cause) => {
                  if (cause._tag === "Fail") {
                    handleError(cause.error, res)
                  } else {
                    handleError(
                      new HttpError(500, "Process failed for middleware", {
                        cause,
                      }),
                      res,
                    )
                  }
                },
                onSuccess: (result) => {
                  for (const [key, value] of Object.entries(result)) {
                    // @ts-expect-error key is actually keyof L
                    req[key] = value
                  }

                  next()
                },
              }),
            )
          })().then(constVoid, constVoid)
        },
      ),
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
      Response,
      Locals
    >,
  ) {
    return (
      req: Request<
        RouteParameters<Path>,
        Response,
        BodyFrom,
        QueryFrom,
        Locals
      >,
      res: express.Response<Response, Locals>,
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
            locals: req as unknown as Locals,
          })

          res.json(result).end()
        } catch (e) {
          handleError(e, res)
        }
      })().then(constVoid, constVoid)
    }
  }
}
