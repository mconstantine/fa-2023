import * as S from "@effect/schema/Schema"
import { PaginationResponse as PaginationResponseType } from "../../../backend/src/database/domain"
import { Option } from "effect"

export class PaginationResponse<T extends { id: S.Schema.To<typeof S.UUID> }> {
  private constructor(public readonly response: PaginationResponseType<T>) {}

  public static of<T extends { id: S.Schema.To<typeof S.UUID> }>(
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

  public replace(node: T): PaginationResponse<T> {
    return new PaginationResponse({
      ...this.response,
      edges: this.response.edges.map((edge) => {
        if (edge.node.id === node.id) {
          return { cursor: node.id, node }
        } else {
          return edge
        }
      }),
    })
  }

  public remove(node: T): PaginationResponse<T> {
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

  public getNodes(): T[] {
    return this.response.edges.map((edge) => edge.node)
  }

  public getTotalCount(): number {
    return this.response.page_info.total_count
  }

  public getStartCursor(): Option.Option<S.Schema.To<typeof S.UUID>> {
    return Option.fromNullable(this.response.page_info.start_cursor)
  }

  public getEndCursor(): Option.Option<S.Schema.To<typeof S.UUID>> {
    return Option.fromNullable(this.response.page_info.end_cursor)
  }

  public hasPreviousPage(): boolean {
    return this.response.page_info.has_previous_page
  }

  public hasNextPage(): boolean {
    return this.response.page_info.has_next_page
  }
}
