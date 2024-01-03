import { useState } from "react"

type FormData<T extends Record<string, unknown>> = {
  [key in keyof T]: T[key] | null
}

function isValidFormData<T extends Record<string, unknown>>(
  formData: FormData<T>,
): formData is T {
  return Object.entries(formData)
    .filter(([key]) => key !== "id")
    .every(([, value]) => value !== null)
}

interface UseFormOutput<T extends Record<string, unknown>> {
  inputProps<K extends keyof T, D = null>(
    key: K,
    defaultValue: D,
  ): {
    name: K
    value: T[K] | D
    onChange(value: T[K]): void
  }
  submit(): void
  isValid: () => boolean
}

export function useForm<T extends Record<string, unknown>>(
  data: FormData<T>,
  onSubmit: (data: T) => void,
): UseFormOutput<T> {
  const [state, setState] = useState(data)

  return {
    inputProps(key, defaultValue) {
      return {
        name: key,
        value: state[key] ?? defaultValue,
        onChange: (value) =>
          setState((state) => ({
            ...state,
            [key]: value,
          })),
      }
    },
    submit() {
      if (isValidFormData(state)) {
        onSubmit(state)
      }
    },
    isValid() {
      return isValidFormData(state)
    },
  }
}
