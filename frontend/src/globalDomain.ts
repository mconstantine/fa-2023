import { Param } from "./hooks/network"

export interface PaginationParams extends Record<string, Param> {
  page: number
  perPage: number
}

export type PaginatedResponse<T> = [T[], number]
