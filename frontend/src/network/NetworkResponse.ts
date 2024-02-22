/* eslint-disable @typescript-eslint/no-explicit-any */

import { flow } from "effect"

interface IdleNetworkResponse {
  readonly tag: "Idle"
}

interface LoadingNetworkResponse {
  readonly tag: "Loading"
}

interface FailedNetworkResponse<E> {
  readonly tag: "Failure"
  readonly error: E
}

interface SuccessfulNetworkResponse<A> {
  readonly tag: "Success"
  readonly data: A
}

export type NetworkResponse<E, A> =
  | IdleNetworkResponse
  | LoadingNetworkResponse
  | FailedNetworkResponse<E>
  | SuccessfulNetworkResponse<A>

export function idle(): IdleNetworkResponse {
  return { tag: "Idle" }
}

function loading(): LoadingNetworkResponse {
  return { tag: "Loading" }
}

export function load(): (self: IdleNetworkResponse) => LoadingNetworkResponse {
  return loading
}

function failure<E>(error: E): FailedNetworkResponse<E> {
  return { tag: "Failure", error }
}

export function fail<E>(
  error: E,
): (self: LoadingNetworkResponse) => FailedNetworkResponse<E> {
  return () => failure(error)
}

export function succeed(): (
  self: LoadingNetworkResponse,
) => SuccessfulNetworkResponse<void>
export function succeed<A>(
  data: A,
): (self: LoadingNetworkResponse) => SuccessfulNetworkResponse<A>
export function succeed<A>(
  data?: A,
): (self: LoadingNetworkResponse) => SuccessfulNetworkResponse<A> {
  // @ts-expect-error void data is allowed
  return () => successful(data)
}

export function retry<E>(): (
  self: FailedNetworkResponse<E>,
) => LoadingNetworkResponse {
  return loading
}

export function refresh<A>(): (
  self: SuccessfulNetworkResponse<A>,
) => LoadingNetworkResponse {
  return loading
}

function successful<A>(data: A): SuccessfulNetworkResponse<A> {
  return { tag: "Success", data }
}

export function isIdle<E, A>(
  self: NetworkResponse<E, A>,
): self is IdleNetworkResponse {
  return self.tag === "Idle"
}

export function isLoading<E, A>(
  self: NetworkResponse<E, A>,
): self is LoadingNetworkResponse {
  return self.tag === "Loading"
}

export function isFailure<E, A>(
  self: NetworkResponse<E, A>,
): self is FailedNetworkResponse<E> {
  return self.tag === "Failure"
}

export function isSuccessful<E, A>(
  self: NetworkResponse<E, A>,
): self is SuccessfulNetworkResponse<A> {
  return self.tag === "Success"
}

// @ts-expect-error this is too much
export const all: <
  const I extends
    | Iterable<NetworkResponse<any, any>>
    | Record<string, NetworkResponse<any, any>>,
>(
  input: I,
) => [I] extends [ReadonlyArray<NetworkResponse<any, any>>]
  ? NetworkResponse<
      I[number] extends never
        ? never
        : [I[number]] extends [NetworkResponse<infer E, any>]
        ? E
        : never,
      {
        -readonly [K in keyof I]: [I[K]] extends [NetworkResponse<any, infer A>]
          ? A
          : never
      }
    >
  : [I] extends [Iterable<NetworkResponse<infer E, infer A>>]
  ? NetworkResponse<E, Array<A>>
  : NetworkResponse<
      I[keyof I] extends never
        ? never
        : [I[keyof I]] extends [NetworkResponse<infer E, any>]
        ? E
        : never,
      {
        -readonly [K in keyof I]: [I[K]] extends [NetworkResponse<any, infer A>]
          ? A
          : never
      }
    > = (
  input:
    | Iterable<NetworkResponse<any, any>>
    | Record<string, NetworkResponse<any, any>>,
): NetworkResponse<any, any> => {
  if (Symbol.iterator in input) {
    const result: Array<NetworkResponse<any, any>> = []

    for (const entry of input) {
      if (isIdle(entry) || isLoading(entry) || isFailure(entry)) {
        return entry
      } else {
        result.push(entry.data)
      }
    }

    return successful(result)
  } else {
    const result: Record<string, NetworkResponse<any, any>> = {}

    for (const [key, value] of Object.entries(input)) {
      if (isIdle(value) || isLoading(value) || isFailure(value)) {
        return value
      } else {
        result[key] = value.data
      }
    }

    return successful(result)
  }
}

export function flatMatch<E, A, R>(options: {
  onIdle(response: IdleNetworkResponse): R
  onLoading(response: LoadingNetworkResponse): R
  onFailure(response: FailedNetworkResponse<E>): R
  onSuccess(response: SuccessfulNetworkResponse<A>): R
}): (response: NetworkResponse<E, A>) => R {
  return (response) => {
    switch (response.tag) {
      case "Idle":
        return options.onIdle(response)
      case "Loading":
        return options.onLoading(response)
      case "Failure":
        return options.onFailure(response)
      case "Success":
        return options.onSuccess(response)
    }
  }
}

export function match<E, A, R>(options: {
  onIdle(): R
  onLoading(): R
  onFailure(error: E): R
  onSuccess(data: A): R
}): (response: NetworkResponse<E, A>) => R {
  return flatMatch({
    onIdle: options.onIdle,
    onLoading: options.onLoading,
    onFailure: (r) => options.onFailure(r.error),
    onSuccess: (r) => options.onSuccess(r.data),
  })
}

export function getOrElse<E, A, D = A>(
  defaultValue: () => D,
): (self: NetworkResponse<E, A>) => A | D {
  return (self) => {
    if (isSuccessful(self)) {
      return self.data
    } else {
      return defaultValue()
    }
  }
}

export function flatMap<E, A, R>(
  fn: (data: A) => NetworkResponse<E, R>,
): (self: NetworkResponse<E, A>) => NetworkResponse<E, R> {
  return match({
    onIdle: idle,
    onLoading: loading,
    onFailure: failure,
    onSuccess: fn,
  })
}

export function andThen<E, A, R>(
  fn: () => NetworkResponse<E, R>,
): (self: NetworkResponse<E, A>) => NetworkResponse<E, R> {
  return match({
    onIdle: fn,
    onLoading: loading,
    onFailure: failure,
    onSuccess: fn,
  })
}

export function map<E, A, R>(
  fn: (data: A) => R,
): (self: NetworkResponse<E, A>) => NetworkResponse<E, R> {
  return flatMap((data) => successful(fn(data)))
}

export function mapError<E1, A, E2>(
  fn: (data: E1) => E2,
): (self: NetworkResponse<E1, A>) => NetworkResponse<E2, A> {
  return match<E1, A, NetworkResponse<E2, A>>({
    onIdle: idle,
    onLoading: loading,
    onFailure: flow(fn, failure),
    onSuccess: successful,
  })
}

export function withErrorFrom<E, A, B>(
  that: NetworkResponse<E, B>,
): (self: NetworkResponse<E, A>) => NetworkResponse<E, A> {
  return (self) => {
    if (isFailure(that)) {
      return failure(that.error)
    } else {
      return self
    }
  }
}
