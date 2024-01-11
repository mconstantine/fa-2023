export type NetworkResponse<O> = NetworkResponseC<O> &
  (
    | IdleResponse<O>
    | LoadingResponse<O>
    | FailedResponse<O>
    | SuccessfulResponse<O>
  )

function fromSuccess(): SuccessfulResponse<void>
function fromSuccess<O>(data: O): SuccessfulResponse<O>
function fromSuccess<O>(data?: O): SuccessfulResponse<O> {
  return new SuccessfulResponse(data as O)
}

export const networkResponse = {
  make<O>(): IdleResponse<O> {
    return new IdleResponse()
  },
  fromFailure<O>(status: number, message: string): FailedResponse<O> {
    return new FailedResponse(status, message)
  },
  fromSuccess,
}

abstract class NetworkResponseC<O> {
  protected constructor() {}

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

  public match<T>(
    this: NetworkResponse<O>,
    cases: {
      whenIdle(response: IdleResponse<O>): T
      whenLoading(response: LoadingResponse<O>): T
      whenFailed(response: FailedResponse<O>): T
      whenSuccessful(response: SuccessfulResponse<O>): T
    },
  ): T {
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
    if (this.isSuccessful()) {
      return this.data
    } else {
      return defaultValue
    }
  }

  public flatMap<T>(fn: (data: O) => NetworkResponse<T>): NetworkResponse<T> {
    return this.match({
      whenIdle: () => networkResponse.make(),
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

class IdleResponse<O> extends NetworkResponseC<O> {
  public constructor() {
    super()
  }
}

class LoadingResponse<O> extends NetworkResponseC<O> {
  public constructor() {
    super()
  }

  public fail(status: number, message: string): FailedResponse<O> {
    return new FailedResponse(status, message)
  }

  public succeed<O>(data: O): SuccessfulResponse<O> {
    return new SuccessfulResponse(data)
  }
}

class FailedResponse<O> extends NetworkResponseC<O> {
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

class SuccessfulResponse<O> extends NetworkResponseC<O> {
  public constructor(public readonly data: O) {
    super()
  }

  public refresh(): LoadingResponse<O> {
    return new LoadingResponse()
  }
}
