export class NetworkResponse<O> {
  public load(): LoadingResponse<O> {
    return new LoadingResponse()
  }

  static fromFailure<O>(status: number, message: string): FailedResponse<O> {
    return new FailedResponse(status, message)
  }

  static fromSuccess<O>(data: O): SuccessfulResponse<O> {
    return new SuccessfulResponse(data)
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
    whenIdle(): T
    whenLoading(): T
    whenFailed(response: FailedResponse<O>): T
    whenSuccessful(response: SuccessfulResponse<O>): T
  }): T {
    if (this.isLoading()) {
      return cases.whenLoading()
    } else if (this.isFailure()) {
      return cases.whenFailed(this)
    } else if (this.isSuccessful()) {
      return cases.whenSuccessful(this)
    } else {
      return cases.whenIdle()
    }
  }

  public getOrElse(defaultValue: O): O {
    return this.match({
      whenIdle: () => defaultValue,
      whenLoading: () => defaultValue,
      whenFailed: () => defaultValue,
      whenSuccessful: (response) => response.data,
    })
  }

  public map<T>(mapFn: (data: O) => T): NetworkResponse<T> {
    return this.match({
      whenIdle: () => new NetworkResponse(),
      whenLoading: () => new LoadingResponse(),
      whenFailed: (response) =>
        new FailedResponse<T>(response.status, response.message),
      whenSuccessful: (response) =>
        new SuccessfulResponse(mapFn(response.data)),
    })
  }
}

class LoadingResponse<O> extends NetworkResponse<O> {
  public fail(status: number, message: string): FailedResponse<O> {
    return new FailedResponse(status, message)
  }

  public succeed<O>(data: O): SuccessfulResponse<O> {
    return new SuccessfulResponse(data)
  }
}

class FailedResponse<O> extends NetworkResponse<O> {
  public readonly status: number
  public readonly message: string

  public constructor(status: number, message: string) {
    super()
    this.status = status
    this.message = message
  }

  public retry(): LoadingResponse<O> {
    return new LoadingResponse()
  }
}

class SuccessfulResponse<O> extends NetworkResponse<O> {
  public readonly data: O

  public constructor(data: O) {
    super()
    this.data = data
  }

  public refresh(): LoadingResponse<O> {
    return new LoadingResponse()
  }
}
