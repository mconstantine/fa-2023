import * as S from "@effect/schema/Schema"
import { Either, Option, ReadonlyRecord, identity, pipe } from "effect"
import { useState } from "react"

/* eslint-disable @typescript-eslint/no-explicit-any */

type Validators<Values extends Record<string, unknown>> = {
  [K in keyof Values]?: S.Schema<any, any>
}

type InitialValues<
  R extends Record<string, unknown>,
  V extends Validators<R>,
> = {
  [K in keyof R]: V[K] extends S.Schema<infer A, any> ? A | null : R[K] | null
}

type Validated<R extends Record<string, unknown>, V extends Validators<R>> = {
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
  initialValues: InitialValues<R, V>
  validators: V
  formValidator: F
  submit(data: FormValidated<R, V, F, T>): void
}

interface UseFormInputNoFormValidator<
  R extends Record<string, unknown>,
  V extends Validators<R>,
> {
  initialValues: InitialValues<R, V>
  validators: V
  submit(data: Validated<R, V>): void
}

export interface InputProps<A, I> {
  name: string
  value: I
  error: Option.Option<string>
  onChange(value: I): Either.Either<string, A>
}

interface UseFormOutput<
  R extends Record<string, unknown>,
  V extends Validators<R>,
> {
  validated: Validated<R, V>
  inputProps<K extends keyof R>(
    name: K,
  ): InputProps<
    V[K] extends S.Schema<infer A, any> ? A : R[K],
    V[K] extends S.Schema<any, infer I> ? I : R[K]
  >
  submit(): void
  isValid(): boolean
  formError: Option.Option<string>
}

interface UseFormOutputNoFormValidator<
  R extends Record<string, unknown>,
  V extends Validators<R>,
> {
  validated: Validated<R, V>
  inputProps<K extends keyof R>(
    name: K,
  ): InputProps<
    V[K] extends S.Schema<infer A, any> ? A : R[K],
    V[K] extends S.Schema<any, infer I> ? I : R[K]
  >
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
  validated: Validated<R, V>
}

/*
There's a little trick here: initial values are not validated, so error messages don't appear as soon as
the form is rendered. They are still validated before submit, specifically:

- Every time any field changes, it's validated
- When the submit button is clicked (on submit), all fields are validated

More about that later.
*/
export function useForm<
  R extends Record<string, unknown>,
  V extends Validators<R>,
  F extends (data: Validated<R, V>) => Either.Either<string, T>,
  T extends Record<keyof R, unknown>,
>(input: UseFormInput<R, V, F, T>): UseFormOutput<R, V>
export function useForm<
  R extends Record<string, unknown>,
  V extends Validators<R>,
>(input: UseFormInputNoFormValidator<R, V>): UseFormOutputNoFormValidator<R, V>
export function useForm<
  R extends Record<string, unknown>,
  V extends Validators<R>,
  F extends (data: Validated<R, V>) => Either.Either<string, T>,
  T extends Record<keyof R, unknown>,
>(
  input: UseFormInput<R, V, F, T> | UseFormInputNoFormValidator<R, V>,
): UseFormOutput<R, V> {
  const [state, setState] = useState<FormState<R, V>>({
    formError: Option.none(),
    props: pipe(
      input.initialValues as Record<string, unknown>,
      ReadonlyRecord.map((value, key) =>
        initialValueToFormDataEntry(value, input.validators[key]),
      ),
    ) as FormState<R, V>["props"],
    // This is NOT true, some values could be null here
    validated: input.initialValues as Validated<R, V>,
  })

  function inputProps<K extends keyof R>(
    name: K,
  ): InputProps<
    V[K] extends S.Schema<infer A, any> ? A : R[K],
    V[K] extends S.Schema<any, infer I> ? I : R[K]
  > {
    return {
      name: name as string,
      value: state.props[name].value as V[K] extends S.Schema<
        any,
        infer I,
        never
      >
        ? I
        : R[K],
      error: pipe(
        state.props[name].validation,
        Either.match({
          onLeft: (error) => Option.some(error),
          onRight: () => Option.none(),
        }),
      ),
      onChange(value) {
        const validation =
          typeof input.validators[name] === "undefined"
            ? Either.right(value)
            : pipe(
                value,
                S.decodeEither(input.validators[name]!),
                Either.mapLeft((error) => error.message),
              )

        setState((state) => {
          return {
            formError: Option.none(),
            props: {
              ...state.props,
              [name]: { value, validation },
            },
            validated: {
              ...state.validated,
              [name]: pipe(
                validation,
                Either.match({
                  onLeft: () => state.validated[name],
                  onRight: identity,
                }),
              ),
            },
          }
        })

        return validation
      },
    }
  }

  function submit(): void {
    const validatedProps = pipe(
      state.props as Record<string, FormState<R, V>["props"][keyof R]>,
      ReadonlyRecord.map((entry, key) => {
        if (typeof input.validators[key] === "undefined") {
          return Either.right(entry.value)
        } else {
          return pipe(
            entry.value,
            S.decodeEither(input.validators[key]!),
            Either.mapLeft((error) => error.message),
          )
        }
      }),
    )

    if (Object.values(validatedProps).some(Either.isLeft)) {
      // All fields are validated again here, so the initial lack of validation is ok
      const errors = Object.fromEntries(
        Object.entries(validatedProps)
          .filter(([, e]) => Either.isLeft(e))
          .map(([key, value]) => [
            key,
            (value as Either.Left<string, unknown>).left,
          ]),
      ) as Record<keyof R, string>

      setState((state) => ({
        ...state,
        props: pipe(
          state.props as Record<string, FormState<R, V>["props"][keyof R]>,
          ReadonlyRecord.map((value, key) => {
            if (key in errors) {
              return {
                ...value,
                validation: Either.left(errors[key]),
              }
            } else {
              return value
            }
          }),
        ) as FormState<R, V>["props"],
      }))
    } else {
      const validated = Either.all(validatedProps) as Either.Either<
        string,
        Validated<R, V>
      >

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
  }

  function isValid(): boolean {
    return Object.values(state.props).every((entry) =>
      Either.isRight(entry.validation),
    )
  }

  return {
    inputProps,
    submit,
    isValid,
    validated: state.validated,
    formError: state.formError,
  }
}

// Use this only for the initial values of the state, as this is all a lie.
// All validations are initialized as valid and some initial values could be
// null. This is ok as all fields are validated on submit, so they can't
// escape validation even if they are never touched.
function initialValueToFormDataEntry<
  K extends keyof R,
  R extends Record<string, unknown>,
  V extends Validators<R>,
>(value: Validated<R, V>[K], validator: V[K]): Validated<R, V>[K] {
  const validation =
    typeof validator === "undefined"
      ? Either.right(value)
      : pipe(
          value,
          S.encodeEither(validator),
          Either.mapLeft((error) => error.message),
        )

  const encoded = pipe(
    validation,
    Either.getOrElse(() => value),
  )

  return {
    value: encoded,
    validation: Either.right(value),
  } as Validated<R, V>[K]
}
