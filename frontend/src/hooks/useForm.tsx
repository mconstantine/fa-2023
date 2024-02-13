import * as S from "@effect/schema/Schema"
import { Either, Option, ReadonlyRecord, pipe } from "effect"
import { useState } from "react"

type Validators<Values extends Record<string, unknown>> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in keyof Values]?: S.Schema<any, any>
}

type Validated<R extends Record<string, unknown>, V extends Validators<R>> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in keyof R]: V[K] extends S.Schema<infer A, any> ? A : R[K]
}

type FormValidated<
  R extends Record<string, unknown>,
  V extends Validators<R>,
  F extends FormValidator<R, V, T>,
  T extends Record<keyof R, unknown>,
> = F extends FormValidator<R, V, infer X> ? X : Validated<R, V>

interface FormValidator<
  R extends Record<string, unknown>,
  V extends Validators<R>,
  T extends Record<keyof R, unknown>,
> {
  (data: Validated<R, V>): Either.Either<string, T>
}

interface UseFormInput<
  R extends Record<string, unknown>,
  V extends Validators<R>,
  F extends FormValidator<R, V, T>,
  T extends Record<keyof R, unknown>,
> {
  initialValues: Validated<R, V>
  validators: V
  formValidator: F
  submit(data: FormValidated<R, V, F, T>): void
}

interface UseFormInputNoFormValidator<
  R extends Record<string, unknown>,
  V extends Validators<R>,
> {
  initialValues: Validated<R, V>
  validators: V
  submit(data: Validated<R, V>): void
}

export interface InputProps<T> {
  name: string
  value: T
  error: Option.Option<string>
  onChange(value: T): void
}

interface UseFormOutput<R extends Record<string, unknown>> {
  inputProps<K extends keyof R>(name: K): InputProps<R[K]>
  submit(): void
  isValid(): boolean
  formError: Option.Option<string>
}

interface UseFormOutputNoFormValidator<R extends Record<string, unknown>> {
  inputProps<K extends keyof R>(name: K): InputProps<R[K]>
  submit(): void
  isValid(): boolean
}

type FormState<R extends Record<string, unknown>, V extends Validators<R>> = {
  formError: Option.Option<string>
  props: {
    [K in keyof R]: {
      value: R[K]
      validation: Either.Either<string, Validated<R, V>[K]>
    }
  }
}

export function useForm<
  R extends Record<string, unknown>,
  V extends Validators<R>,
  F extends (data: Validated<R, V>) => Either.Either<string, T>,
  T extends Record<keyof R, unknown>,
>(input: UseFormInput<R, V, F, T>): UseFormOutput<R>
export function useForm<
  R extends Record<string, unknown>,
  V extends Validators<R>,
>(input: UseFormInputNoFormValidator<R, V>): UseFormOutputNoFormValidator<R>
export function useForm<
  R extends Record<string, unknown>,
  V extends Validators<R>,
  F extends (data: Validated<R, V>) => Either.Either<string, T>,
  T extends Record<keyof R, unknown>,
>(
  input: UseFormInput<R, V, F, T> | UseFormInputNoFormValidator<R, V>,
): UseFormOutput<R> {
  const [state, setState] = useState<FormState<R, V>>({
    formError: Option.none(),
    props: Object.fromEntries(
      Object.entries(input.initialValues).map(([k, v]) => {
        const value = initialValueToFormDataEntry(v, input.validators[v])
        return [k, value]
      }),
    ) as FormState<R, V>["props"],
  })

  function inputProps<K extends keyof R>(name: K): InputProps<R[K]> {
    return {
      name: name as string,
      value: state.props[name].value,
      error: pipe(
        state.props[name].validation,
        Either.match({
          onLeft: (error) => Option.some(error),
          onRight: () => Option.none(),
        }),
      ),
      onChange(value): void {
        setState((state) => {
          const validation =
            typeof input.validators[name] === "undefined"
              ? Either.right(value)
              : pipe(
                  value,
                  S.decodeEither(input.validators[name]!),
                  Either.mapLeft((error) => error.message),
                )

          return {
            formError: Option.none(),
            props: {
              ...state.props,
              [name]: { value, validation },
            },
          }
        })
      },
    }
  }

  function submit(): void {
    const validated = pipe(
      state.props as Record<string, FormState<R, V>["props"][keyof R]>,
      ReadonlyRecord.map((entry) => entry.validation),
      Either.all,
    ) as Either.Either<string, Validated<R, V>>

    const formValidated = (
      "formValidator" in input
        ? pipe(validated, Either.flatMap(input.formValidator))
        : validated
    ) as Either.Either<string, FormValidated<R, V, F, T>>

    return pipe(
      formValidated,
      Either.match({
        onLeft: (error) =>
          setState((state) => ({ ...state, formError: Option.some(error) })),
        onRight: (data) =>
          input.submit(data as FormValidated<R, V, F, T> & Validated<R, V>),
      }),
    )
  }

  function isValid(): boolean {
    return Object.values(state.props).every((entry) =>
      Either.isRight(entry.validation),
    )
  }

  return { inputProps, submit, isValid, formError: state.formError }
}

function initialValueToFormDataEntry<
  K extends keyof R,
  R extends Record<string, unknown>,
  V extends Validators<R>,
>(value: Validated<R, V>[K], validator: V[K]): Validated<R, V>[K] {
  const encoded =
    typeof validator === "undefined" ? value : S.encodeSync(validator)(value)

  return {
    value: encoded,
    validation: Either.right(value),
  } as Validated<R, V>[K]
}
