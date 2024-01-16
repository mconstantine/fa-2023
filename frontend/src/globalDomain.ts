export interface PaginationParams
  extends Record<string, string | number | string[] | undefined> {
  page: number
  perPage: number
}

export type PaginatedResponse<T> = [T[], number]
