import { PaginationResponse as PaginationResponseType } from "../../../backend/src/database/domain"
import { Option } from "effect"

export class PaginationResponse<T extends { id: string }> {
  private constructor(public readonly response: PaginationResponseType<T>) {}

  public static of<T extends { id: string }>(
    content: PaginationResponseType<T>,
  ): PaginationResponse<T> {
    return new PaginationResponse(content)
  }

  public prepend(node: T): PaginationResponse<T> {
    return new PaginationResponse({
      ...this.response,
      page_info: {
        ...this.response.page_info,
        total_count: this.response.page_info.total_count + 1,
        start_cursor: node.id,
      },
      edges: [
        {
          cursor: node.id,
          node,
        },
        ...this.response.edges,
      ],
    })
  }

  public append(node: T): PaginationResponse<T> {
    return new PaginationResponse({
      ...this.response,
      page_info: {
        ...this.response.page_info,
        total_count: this.response.page_info.total_count + 1,
        end_cursor: node.id,
      },
      edges: [
        ...this.response.edges,
        {
          cursor: node.id,
          node,
        },
      ],
    })
  }

  public replace(update: T): PaginationResponse<T>
  public replace(update: readonly T[]): PaginationResponse<T>
  public replace(update: T | readonly T[]): PaginationResponse<T> {
    return new PaginationResponse({
      ...this.response,
      edges: this.response.edges.map((edge) => {
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

  public remove(node: { id: string }): PaginationResponse<T> {
    const startCursor = (() => {
      if (this.response.page_info.start_cursor === node.id) {
        return this.response.edges[1]?.cursor ?? null
      } else {
        return this.response.page_info.start_cursor
      }
    })()

    const endCursor = (() => {
      if (this.response.page_info.end_cursor === node.id) {
        return (
          this.response.edges[this.response.edges.length - 1]?.cursor ?? null
        )
      } else {
        return this.response.page_info.end_cursor
      }
    })()

    return new PaginationResponse({
      ...this.response,
      page_info: {
        ...this.response.page_info,
        start_cursor: startCursor,
        end_cursor: endCursor,
        total_count: this.response.page_info.total_count - 1,
      },
      edges: this.response.edges.filter((edge) => edge.node.id !== node.id),
    })
  }

  public mapNodes<R extends { id: string }>(
    mapFn: (node: T) => R,
  ): PaginationResponse<R> {
    return new PaginationResponse({
      page_info: this.response.page_info,
      edges: this.response.edges.map((edge) => ({
        cursor: edge.cursor,
        node: mapFn(edge.node),
      })),
    })
  }

  public getNodes(): T[] {
    return this.response.edges.map((edge) => edge.node)
  }

  public getTotalCount(): number {
    return this.response.page_info.total_count
  }

  public getStartCursor(): Option.Option<string> {
    return Option.fromNullable(this.response.page_info.start_cursor)
  }

  public getEndCursor(): Option.Option<string> {
    return Option.fromNullable(this.response.page_info.end_cursor)
  }

  public hasPreviousPage(): boolean {
    return this.response.page_info.has_previous_page
  }

  public hasNextPage(): boolean {
    return this.response.page_info.has_next_page
  }
}
