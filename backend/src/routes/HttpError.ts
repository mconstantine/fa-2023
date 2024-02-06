export class HttpError extends Error {
  public readonly code: number

  public constructor(code: number, message: string) {
    super(message)
    this.code = code
  }
}
