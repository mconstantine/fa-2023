import { Option, pipe } from "effect"
import { PaginationResponse } from "../globalDomain"

export function fromNodes<T extends { id: string }>(
  nodes: readonly T[],
): PaginationResponse<T> {
  const firstNode = Option.fromNullable(nodes[0])
  const lastNode = Option.fromNullable(nodes[nodes.length - 1])

  return {
    page_info: {
      total_count: nodes.length,
      start_cursor: pipe(
        firstNode,
        Option.map((node) => node.id),
        Option.getOrNull,
      ),
      end_cursor: pipe(
        lastNode,
        Option.map((node) => node.id),
        Option.getOrNull,
      ),
      has_previous_page: false,
      has_next_page: false,
    },
    edges: nodes.map((node) => ({
      cursor: node.id,
      node,
    })),
  }
}

export function prepend<T extends { id: string }>(
  node: T,
): (response: PaginationResponse<T>) => PaginationResponse<T> {
  return (response) => ({
    ...response,
    page_info: {
      ...response.page_info,
      total_count: response.page_info.total_count + 1,
      start_cursor: node.id,
    },
    edges: [
      {
        cursor: node.id,
        node,
      },
      ...response.edges,
    ],
  })
}

export function append<T extends { id: string }>(
  node: T,
): (response: PaginationResponse<T>) => PaginationResponse<T> {
  return (response) => ({
    ...response,
    page_info: {
      ...response.page_info,
      total_count: response.page_info.total_count + 1,
      end_cursor: node.id,
    },
    edges: [
      ...response.edges,
      {
        cursor: node.id,
        node,
      },
    ],
  })
}

export function replace<T extends { id: string }>(
  update: T,
): (response: PaginationResponse<T>) => PaginationResponse<T>
export function replace<T extends { id: string }>(
  update: readonly T[],
): (response: PaginationResponse<T>) => PaginationResponse<T>
export function replace<T extends { id: string }>(
  update: T | readonly T[],
): (response: PaginationResponse<T>) => PaginationResponse<T> {
  return (response) => ({
    ...response,
    edges: response.edges.map((edge) => {
      if (Array.isArray(update)) {
        const updated = update.find((node) => edge.node.id === node.id)

        if (typeof updated !== "undefined") {
          return { cursor: updated.id, node: updated }
        } else {
          return edge
        }
      } else {
        if (edge.node.id === (update as T).id) {
          return { cursor: (update as T).id, node: update }
        } else {
          return edge
        }
      }
    }),
  })
}

export function remove<T extends { id: string }>(node: {
  id: string
}): (response: PaginationResponse<T>) => PaginationResponse<T> {
  return (response) => {
    const startCursor = (() => {
      if (response.page_info.start_cursor === node.id) {
        return response.edges[1]?.cursor ?? null
      } else {
        return response.page_info.start_cursor
      }
    })()

    const endCursor = (() => {
      if (response.page_info.end_cursor === node.id) {
        return response.edges[response.edges.length - 1]?.cursor ?? null
      } else {
        return response.page_info.end_cursor
      }
    })()

    return {
      ...response,
      page_info: {
        ...response.page_info,
        start_cursor: startCursor,
        end_cursor: endCursor,
        total_count: response.page_info.total_count - 1,
      },
      edges: response.edges.filter((edge) => edge.node.id !== node.id),
    }
  }
}

export function mapNodes<T extends { id: string }, R extends { id: string }>(
  mapFn: (node: T) => R,
): (response: PaginationResponse<T>) => PaginationResponse<R> {
  return (response) => ({
    page_info: response.page_info,
    edges: response.edges.map((edge) => ({
      cursor: edge.cursor,
      node: mapFn(edge.node),
    })),
  })
}

export function getNodes<T extends { id: string }>(
  response: PaginationResponse<T>,
): T[] {
  return response.edges.map((edge) => edge.node)
}

export function getTotalCount<T extends { id: string }>(
  response: PaginationResponse<T>,
): number {
  return response.page_info.total_count
}

export function getStartCursor<T extends { id: string }>(
  response: PaginationResponse<T>,
): Option.Option<string> {
  return Option.fromNullable(response.page_info.start_cursor)
}

export function getEndCursor<T extends { id: string }>(
  response: PaginationResponse<T>,
): Option.Option<string> {
  return Option.fromNullable(response.page_info.end_cursor)
}

export function hasPreviousPage<T extends { id: string }>(
  response: PaginationResponse<T>,
): boolean {
  return response.page_info.has_previous_page
}

export function hasNextPage<T extends { id: string }>(
  response: PaginationResponse<T>,
): boolean {
  return response.page_info.has_next_page
}
