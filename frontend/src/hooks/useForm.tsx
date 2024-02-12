import * as S from "@effect/schema/Schema"
import { Either, Option } from "effect"
import { useState } from "react"

type Validators<Values extends Record<string, unknown>> = {
  [key in keyof Values]?: S.Schema<unknown, unknown>
}

type FormData<R extends Record<string, unknown>, V extends Validators<R>> = {
  [key in keyof R]: V[key] extends S.Schema<infer A, unknown> ? A : R[key]
}

interface UseFormInput<
  R extends Record<string, unknown>,
  V extends Validators<R>,
> {
  initialValues: FormData<R, V>
  validators: V
  formValidator(data: FormData<R, V>): Option.Option<{ error: string }>
  submit(data: FormData<R, V>): void
}

export interface InputProps<T> {
  name: string
  value: T
  error: Option.Option<string>
  onChange(value: T): void
}

interface UseFormOutput<Values extends Record<string, unknown>> {
  inputProps<K extends keyof Values>(name: K): InputProps<Values[K]>
  submit(): void
  isValid(): boolean
}

type FormState<R extends Record<string, unknown>, V extends Validators<R>> = {
  [key in keyof R]: {
    value: FormData<R, V>[key]
    validation: Either.Either<string, FormData<R, V>[key]>
  }
}

export function useForm<
  R extends Record<string, unknown>,
  V extends Validators<R>,
>(input: UseFormInput<R, V>): UseFormOutput<R> {
  const [state, setState] = useState<FormState<R, V>>(
    Object.fromEntries(
      Object.entries(input.initialValues).map(([k, v]) => {
        const value = initialValueToFormDataEntry(v, input.validators[v])
        return [k, value]
      }),
    ) as FormState<R, V>,
  )

  function inputProps<K extends keyof R>(name: K): InputProps<V[K]> {}

  function submit(): void {}

  function isValid(): boolean {}

  return { inputProps, submit, isValid }
}

function initialValueToFormDataEntry<
  K extends keyof R,
  R extends Record<string, unknown>,
  V extends Validators<R>,
>(value: FormData<R, V>[K], validator: V[K]): FormData<R, V>[K] {
  const encoded =
    typeof validator === "undefined" ? value : S.encodeSync(validator)(value)

  return {
    encoded,
    validation: Either.right(value),
  } as FormData<R, V>[K]
}
