import * as S from "@effect/schema/Schema"
import { Either, Option, pipe } from "effect"
import {
  AuthTokens,
  User,
} from "../../../backend/src/database/functions/user/domain"
import { constVoid } from "effect/Function"

/* eslint-disable @typescript-eslint/no-explicit-any */

const LocalStorageMap = {
  authContext: S.struct({
    authTokens: AuthTokens,
    user: User,
  }),
}

type LocalStorageMap = typeof LocalStorageMap

interface UseLocalStorageOutput {
  getStoredValue<K extends keyof LocalStorageMap>(
    key: K,
  ): Option.Option<
    LocalStorageMap[K] extends S.Schema<infer A, any> ? A : never
  >
  setStoredValue<const K extends keyof LocalStorageMap>(
    key: K,
    value: LocalStorageMap[K] extends S.Schema<infer A, any> ? A : never,
  ): void
  removeStoredValue(key: keyof LocalStorageMap): void
}

export function useLocalStorage(): UseLocalStorageOutput {
  return {
    getStoredValue: getLocalStorageValue,
    setStoredValue: setLocalStorageValue,
    removeStoredValue: removeLocalStorageValue,
  }
}

export function getLocalStorageValue<K extends keyof LocalStorageMap>(
  key: K,
): Option.Option<
  LocalStorageMap[K] extends S.Schema<infer A, any> ? A : never
> {
  const value = pipe(
    window.localStorage.getItem(key),
    Option.fromNullable,
    Option.flatMap((stringValue) => {
      try {
        return Option.some(JSON.parse(stringValue))
      } catch (e) {
        console.log(e)
        return Option.none()
      }
    }),
    Option.flatMap(S.decodeUnknownOption(LocalStorageMap[key])),
  )

  return value as Option.Option<
    LocalStorageMap[K] extends S.Schema<infer A, any> ? A : never
  >
}

export function setLocalStorageValue<const K extends keyof LocalStorageMap>(
  key: K,
  value: LocalStorageMap[K] extends S.Schema<infer A, any> ? A : never,
): void {
  pipe(
    value,
    S.encodeUnknownEither(LocalStorageMap[key]),
    Either.match({
      onLeft: constVoid,
      onRight: (encoded) => {
        try {
          const stringValue = JSON.stringify(encoded)
          window.localStorage.setItem(key, stringValue)
        } catch (e) {
          console.log(e)
        }
      },
    }),
  )
}

export function removeLocalStorageValue(key: keyof LocalStorageMap): void {
  window.localStorage.removeItem(key)
}
