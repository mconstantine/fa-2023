type MergedResult<E, Map extends Record<string, Result<E, unknown>>> = {
  [key in keyof Map]: Map[key] extends Result<E, infer R> ? R : never
}

export class Result<E, A> {
  static fromFailure(): FailedResult<void>
  static fromFailure<E>(error: E): FailedResult<E>
  static fromFailure<E, A = unknown>(error?: E): Result<E, A> {
    return new FailedResult(error) as FailedResult<E>
  }

  static fromSuccess<A>(value: A): SuccessfulResult<A>
  static fromSuccess<A, E = unknown>(value: A): Result<E, A> {
    return new SuccessfulResult(value)
  }

  public isFailure(): this is FailedResult<E> {
    return this instanceof FailedResult
  }

  public isSuccessful(): this is SuccessfulResult<A> {
    return this instanceof SuccessfulResult
  }

  public match<T>(
    whenFailure: (error: E) => T,
    whenSuccessful: (value: A) => T,
  ): T {
    if (this.isFailure()) {
      return whenFailure(this.error)
    } else if (this.isSuccessful()) {
      return whenSuccessful(this.value)
    } else {
      throw new Error("Impossible state from matching Result")
    }
  }

  public flatMap<B>(fn: (value: A) => Result<E, B>): Result<E, B> {
    return this.match(
      (error) => Result.fromFailure(error),
      (value) => fn(value),
    )
  }

  public map<B>(fn: (value: A) => B): Result<E, B> {
    return this.flatMap((value) => Result.fromSuccess(fn(value)))
  }

  public static merge<E, T extends Record<string, Result<E, unknown>>>(
    map: T,
  ): Result<E, MergedResult<E, T>> {
    return Object.entries(map).reduce<Result<E, MergedResult<E, T>>>(
      (acc, [key, result]) => {
        return acc.flatMap((accValue) =>
          result.match(
            (error) => Result.fromFailure(error),
            (value) =>
              Result.fromSuccess({
                ...accValue,
                [key]: value,
              }) as Result<E, MergedResult<E, T>>,
          ),
        )
      },
      // eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter
      Result.fromSuccess({}) as unknown as Result<E, MergedResult<E, T>>,
    )
  }

  unsafeGetError(): E {
    return this.match(
      (error) => error,
      (value) => {
        throw new Error(`Expected error, found value: ${JSON.stringify(value)}`)
      },
    )
  }

  unsafeGetValue(): A {
    return this.match(
      (error) => {
        throw new Error(
          `Expected success, found error: ${JSON.stringify(error)}`,
        )
      },
      (value) => value,
    )
  }
}

class FailedResult<E> extends Result<E, never> {
  public readonly error: E

  constructor(error: E) {
    super()
    this.error = error
  }
}

class SuccessfulResult<A> extends Result<never, A> {
  public readonly value: A

  constructor(value: A) {
    super()
    this.value = value
  }
}
