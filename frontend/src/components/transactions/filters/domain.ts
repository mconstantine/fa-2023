import * as S from "@effect/schema/Schema"

export const RelativeRange = S.literal("days", "weeks", "months", "years")
export type RelativeRange = S.Schema.To<typeof RelativeRange>
