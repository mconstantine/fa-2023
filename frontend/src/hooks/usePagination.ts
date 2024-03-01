import { PaginationQuery, PaginationResponse } from "../globalDomain"
import { Option, pipe } from "effect"

interface UsePaginationInput<A, T extends PaginationResponse<A>> {
  filters: PaginationQuery
  paginationResponse: T
  rowsPerPageOptions: number[]
  onFiltersChange: (filters: PaginationQuery) => void
}

export interface UsePaginationOutput {
  count: number
  rowsPerPage: number
  rowsPerPageOptions: number[]
  hasPreviousPage: boolean
  hasNextPage: boolean
  onPageChange(direction: PaginationQuery["direction"]): void
  onRowsPerPageChange(rowsPerPage: number): void
}

export function usePagination<A, T extends PaginationResponse<A>>(
  input: UsePaginationInput<A, T>,
): UsePaginationOutput {
  function onPageChange(direction: PaginationQuery["direction"]): void {
    input.onFiltersChange({
      ...input.filters,
      direction,
      target: pipe(
        (() => {
          switch (direction) {
            case "forward":
              return input.paginationResponse.page_info.end_cursor
            case "backward":
              return input.paginationResponse.page_info.start_cursor
          }
        })(),
        Option.fromNullable,
        Option.getOrUndefined,
      ),
    })
  }

  function onRowsPerPageChange(rowsPerPage: number): void {
    input.onFiltersChange({
      ...input.filters,
      count: rowsPerPage,
    })
  }

  return {
    count: input.paginationResponse.page_info.total_count,
    rowsPerPage: input.filters.count,
    rowsPerPageOptions: input.rowsPerPageOptions,
    hasPreviousPage: input.paginationResponse.page_info.has_previous_page,
    hasNextPage: input.paginationResponse.page_info.has_next_page,
    onPageChange,
    onRowsPerPageChange,
  }
}
