export type Result<E, A> = ResultC<E, A> &
  (FailedResult<E> | SuccessfulResult<A>)

type MergedResult<E, Map extends Record<string, Result<E, unknown>>> = {
  [key in keyof Map]: Map[key] extends Result<E, infer R> ? R : never
}

function fromFailure(): Result<void, never>
function fromFailure<E>(error: E): Result<E, never>
function fromFailure<E, A = never>(error?: E): Result<E, A> {
  return new FailedResult(error) as FailedResult<E>
}

function fromSuccess<A>(value: A): Result<never, A>
function fromSuccess<A, E = never>(value: A): Result<E, A> {
  return new SuccessfulResult(value)
}

export const result = {
  fromFailure,
  fromSuccess,
  merge<E, T extends Record<string, Result<E, unknown>>>(
    map: T,
  ): Result<E, MergedResult<E, T>> {
    return Object.entries(map).reduce<Result<E, MergedResult<E, T>>>(
      (mergedResult, [key, result]) => {
        return mergedResult.flatMap((accValue) => {
          if (result.isFailure()) {
            return result
          } else {
            return this.fromSuccess({
              ...accValue,
              [key]: result.value,
            }) as Result<E, MergedResult<E, T>>
          }
        })
      },
      // eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter
      this.fromSuccess({}) as unknown as Result<E, MergedResult<E, T>>,
    )
  },
}

export abstract class ResultC<E, A> {
  protected constructor() {}

  public isFailure(): this is FailedResult<E> {
    return this instanceof FailedResult
  }

  public isSuccessful(): this is SuccessfulResult<A> {
    return this instanceof SuccessfulResult
  }

  public match<T>(
    this: Result<E, A>,
    whenFailure: (error: E) => T,
    whenSuccessful: (value: A) => T,
  ): T {
    if (this.isFailure()) {
      return whenFailure(this.error)
    } else {
      return whenSuccessful(this.value)
    }
  }

  public flatMap<B>(
    this: Result<E, A>,
    fn: (value: A) => Result<E, B>,
  ): Result<E, B> {
    if (this.isFailure()) {
      return this
    } else {
      return fn(this.value)
    }
  }

  public map<B>(this: Result<E, A>, fn: (value: A) => B): Result<E, B> {
    return this.flatMap((value) => result.fromSuccess(fn(value)))
  }

  public mapError<E2>(this: Result<E, A>, fn: (error: E) => E2): Result<E2, A> {
    if (this.isFailure()) {
      return new FailedResult(fn(this.error))
    } else {
      return this
    }
  }

  unsafeGetError(this: Result<E, A>): E {
    if (this.isFailure()) {
      return this.error
    } else {
      throw new Error(
        `Expected error, found value: ${JSON.stringify(this.value)}`,
      )
    }
  }

  unsafeGetValue(this: Result<E, A>): A {
    if (this.isSuccessful()) {
      return this.value
    } else {
      throw new Error(
        `Expected success, found error: ${JSON.stringify(this.error)}`,
      )
    }
  }
}

class FailedResult<E> extends ResultC<E, never> {
  public readonly error: E

  public constructor(error: E) {
    super()
    this.error = error
  }
}

class SuccessfulResult<A> extends ResultC<never, A> {
  public readonly value: A

  public constructor(value: A) {
    super()
    this.value = value
  }
}
