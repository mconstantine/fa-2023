// interface FailedValidationState {
//   type: "failure"
// }

// interface SuccessfulValidationState<T> {
//   type: "success"
//   value: T
// }

// type ValidationState<T> = FailedValidationState | SuccessfulValidationState<T>

// function failure<T>(): ValidationState<T> {
//   return { type: "failure" }
// }

// function success<T>(value: T): ValidationState<T> {
//   return { type: "success", value }
// }

class Validation<T> {
  protected constructor() {}

  static fromFailure<T>(): FailedValidation<T> {
    return new FailedValidation()
  }

  static fromSuccess<T>(value: T): SuccessfulValidation<T> {
    return new SuccessfulValidation(value)
  }

  isFailure(): this is FailedValidation<T> {
    return this instanceof FailedValidation
  }

  isSuccessful(): this is SuccessfulValidation<T> {
    return this instanceof SuccessfulValidation
  }

  match<O>(whenFailure: () => O, whenSuccessful: (value: T) => O): O {
    if (this.isFailure()) {
      return whenFailure()
    } else {
      return whenSuccessful((this as SuccessfulValidation<T>).value)
    }
  }
}

class FailedValidation<T> extends Validation<T> {}

class SuccessfulValidation<T> extends Validation<T> {
  public constructor(public readonly value: T) {
    super()
  }
}

export class Validator<T> {
  constructor(
    protected readonly validateFn: (input: string) => Validation<T>,
  ) {}

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

  static chain(...validators: Validator<string>[]): Validator<string> {
    return new Validator((input: string) => {
      return validators.reduce<Validation<string>>((result, validator) => {
        return result.match(
          () => Validation.fromFailure(),
          (input) => validator.validateFn(input),
        )
      }, Validation.fromSuccess(input))
    })
  }

  withErrorMessage(errorMessage: string): ValidatorWithErrorMessage<T> {
    return new ValidatorWithErrorMessage(this.validateFn, errorMessage)
  }
}

export class ValidatorWithErrorMessage<T> extends Validator<T> {
  constructor(
    protected override readonly validateFn: (input: string) => Validation<T>,
    public readonly errorMessage: string,
  ) {
    super(validateFn)
  }

  validate(input: string): Validation<T> {
    return this.validateFn(input)
  }
}

interface BaseInputProps<T> {
  name: string
  label: string | undefined
  input: string
  validator: ValidatorWithErrorMessage<T>
  onChange: (value: string) => void
}

interface UntouchedInputProps<T> extends BaseInputProps<T> {
  type: "untouched"
}

interface InvalidInputProps<T> extends BaseInputProps<T> {
  type: "invalid"
  error: string
}

interface ValidInputProps<T> extends BaseInputProps<T> {
  type: "valid"
  value: T
}

export type InputProps<T> =
  | UntouchedInputProps<T>
  | InvalidInputProps<T>
  | ValidInputProps<T>

export const NonBlankString = Validator.fromPredicate(
  (input) => input.trim() !== "",
)

export const NumberFromString = Validator.fromPredicate(
  (input) => !isNaN(parseFloat(input.trim())),
)

export const IntFromString = Validator.fromPredicate(
  (input) => !isNaN(parseInt(input.trim())),
)

export const NonNegativeIntFromString = Validator.chain(
  IntFromString,
  Validator.fromPredicate((input) => parseInt(input) >= 0),
)

export const PositiveIntFromString = Validator.chain(
  NonNegativeIntFromString,
  Validator.fromPredicate((input) => parseInt(input) > 0),
)
