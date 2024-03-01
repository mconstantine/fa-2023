import * as S from "@effect/schema/Schema"
import {
  PaginationQuery as ServerPaginationQuery,
  PaginationResponse as ServerPaginationResponse,
} from "../../backend/src/database/domain"
import { Option, String } from "effect"

export const PaginationQuery = ServerPaginationQuery
export type PaginationQuery = ServerPaginationQuery

export const PaginationResponse = ServerPaginationResponse
export type PaginationResponse<T> = ServerPaginationResponse<T>

export function emptyPaginationResponse<T>(): PaginationResponse<T> {
  return {
    page_info: {
      total_count: 0,
      start_cursor: null,
      end_cursor: null,
      has_previous_page: false,
      has_next_page: false,
    },
    edges: [],
  }
}

function isFile(input: unknown): input is File {
  return input instanceof File
}

export const FileFromSelf = S.declare(isFile, {
  identifier: "FileFromSelf",
  arbitrary: () => (fc) =>
    fc
      .tuple(fc.string(), fc.string())
      .map(([path, content]) => new File([content], path)),
  pretty: () => (file) => `File(${file.name})`,
})

const StringOptionEquivalence = Option.getEquivalence(String.Equivalence)

export function optionStringEq(
  a: Option.Option<string>,
  b: Option.Option<string>,
): boolean {
  return StringOptionEquivalence(a, b)
}
