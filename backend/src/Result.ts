export class Result<E, A> {
  static fromFailure(): FailedResult<void>
  static fromFailure<E>(error: E): FailedResult<E>
  static fromFailure<E>(error?: E): FailedResult<E> {
    return new FailedResult(error) as FailedResult<E>
  }

  static fromSuccess<A>(value: A): SuccessfulResult<A> {
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
