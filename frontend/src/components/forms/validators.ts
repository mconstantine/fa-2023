interface FailedValidationState {
  type: "failure"
}

interface SuccessfulValidationState<T> {
  type: "success"
  value: T
}

type ValidationState<T> = FailedValidationState | SuccessfulValidationState<T>

function failure<T>(): ValidationState<T> {
  return { type: "failure" }
}

function success<T>(value: T): ValidationState<T> {
  return { type: "success", value }
}

class Validation<T> {
  private readonly state: ValidationState<T>

  private constructor(state: ValidationState<T>) {
    this.state = state
  }

  static fromFailure<T>(): Validation<T> {
    return new Validation<T>(failure<T>())
  }

  static fromSuccess<T>(value: T): Validation<T> {
    return new Validation(success(value))
  }

  isFailure(): boolean {
    return this.state.type === "failure"
  }

  isSuccessful(): boolean {
    return this.state.type === "success"
  }

  match<O>(whenFailure: () => O, whenSuccessful: (value: T) => O) {
    switch (this.state.type) {
      case "failure":
        return whenFailure()
      case "success":
        return whenSuccessful(this.state.value)
    }
  }
}

export class Validator<T> {
  protected readonly validateFn: (input: string) => Validation<T>

  constructor(validate: (input: string) => Validation<T>) {
    this.validateFn = validate
  }

  static fromPredicate(
    predicate: (input: string) => boolean,
  ): Validator<string> {
    return new Validator((input: string) => {
      if (predicate(input)) {
        return Validation.fromSuccess(input)
      } else {
        return Validation.fromFailure()
      }
    })
  }

  withErrorMessage(errorMessage: string): ValidatorWithErrorMessage<T> {
    return new ValidatorWithErrorMessage(this.validateFn, errorMessage)
  }
}

class ValidatorWithErrorMessage<T> extends Validator<T> {
  public readonly errorMessage: string

  constructor(
    validate: (input: string) => Validation<T>,
    errorMessage: string,
  ) {
    super(validate)
    this.errorMessage = errorMessage
  }

  validate(input: string): Validation<T> {
    return this.validateFn(input)
  }
}

export interface InputProps<T> {
  name: string
  value: string
  validator: ValidatorWithErrorMessage<T>
}

export const NonBlankString = Validator.fromPredicate(
  (input) => input.trim() !== "",
)
