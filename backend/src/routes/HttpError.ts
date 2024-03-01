export class HttpError extends Error {
  public readonly code: number
  public readonly extras: unknown

  public constructor(code: number, message: string, extras?: unknown) {
    super(message)
    this.code = code
    this.extras = extras
  }
}
