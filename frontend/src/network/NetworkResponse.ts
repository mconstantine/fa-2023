export class NetworkResponse<O> {
  protected constructor() {}

  static make<O>(): NetworkResponse<O> &
    (
      | IdleResponse<O>
      | LoadingResponse<O>
      | FailedResponse<O>
      | SuccessfulResponse<O>
    ) {
    return new IdleResponse()
  }

  static fromFailure<O>(status: number, message: string): FailedResponse<O> {
    return new FailedResponse(status, message)
  }

  static fromSuccess(): SuccessfulResponse<void>
  static fromSuccess<O>(data: O): SuccessfulResponse<O>
  static fromSuccess<O>(data?: O): SuccessfulResponse<O> {
    return new SuccessfulResponse(data as O)
  }

  public load(): LoadingResponse<O> {
    return new LoadingResponse()
  }

  public isIdle(): this is IdleResponse<O> {
    return this instanceof IdleResponse
  }

  public isLoading(): this is LoadingResponse<O> {
    return this instanceof LoadingResponse
  }

  public isFailure(): this is FailedResponse<O> {
    return this instanceof FailedResponse
  }

  public isSuccessful(): this is SuccessfulResponse<O> {
    return this instanceof SuccessfulResponse
  }

  public match<T>(cases: {
    whenIdle(response: IdleResponse<O>): T
    whenLoading(response: LoadingResponse<O>): T
    whenFailed(response: FailedResponse<O>): T
    whenSuccessful(response: SuccessfulResponse<O>): T
  }): T {
    if (this.isLoading()) {
      return cases.whenLoading(this)
    } else if (this.isFailure()) {
      return cases.whenFailed(this)
    } else if (this.isSuccessful()) {
      return cases.whenSuccessful(this)
    } else {
      return cases.whenIdle(this)
    }
  }

  public getOrElse<D = O>(defaultValue: D): O | D {
    return this.match({
      whenIdle: () => defaultValue,
      whenLoading: () => defaultValue,
      whenFailed: () => defaultValue,
      whenSuccessful: (response) => response.data as O | D,
    })
  }

  public flatMap<T>(fn: (data: O) => NetworkResponse<T>): NetworkResponse<T> {
    return this.match({
      whenIdle: () => new NetworkResponse(),
      whenLoading: () => new LoadingResponse(),
      whenFailed: (response) =>
        new FailedResponse<T>(response.status, response.message),
      whenSuccessful: (response) => fn(response.data),
    })
  }

  public map<T>(fn: (data: O) => T): NetworkResponse<T> {
    return this.flatMap((data) => new SuccessfulResponse(fn(data)))
  }
}

class IdleResponse<O> extends NetworkResponse<O> {}

class LoadingResponse<O> extends NetworkResponse<O> {
  public fail(status: number, message: string): FailedResponse<O> {
    return new FailedResponse(status, message)
  }

  public succeed<O>(data: O): SuccessfulResponse<O> {
    return new SuccessfulResponse(data)
  }
}

class FailedResponse<O> extends NetworkResponse<O> {
  public constructor(
    public readonly status: number,
    public readonly message: string,
  ) {
    super()
  }

  public retry(): LoadingResponse<O> {
    return new LoadingResponse()
  }
}

class SuccessfulResponse<O> extends NetworkResponse<O> {
  public constructor(public readonly data: O) {
    super()
  }

  public refresh(): LoadingResponse<O> {
    return new LoadingResponse()
  }
}
