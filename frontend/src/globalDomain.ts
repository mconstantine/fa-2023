import {
  PaginationQuery as ServerPaginationQuery,
  PaginationResponse as ServerPaginationResponse,
} from "../../backend/src/database/domain"

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
