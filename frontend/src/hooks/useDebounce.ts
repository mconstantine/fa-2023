import { useRef } from "react"

export function useDebounce<I extends Array<unknown>>(
  fn: (...args: I) => void,
  delayMs: number,
): (...args: I) => void {
  const timeout = useRef<number | null>(null)

  return (...args: I) => {
    if (timeout.current !== null) {
      window.clearTimeout(timeout.current)
    }

    timeout.current = window.setTimeout(() => fn(...args), delayMs)
  }
}
