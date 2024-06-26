import * as S from "@effect/schema/Schema"
import { decodeUrlQuery, populateUrlParams, populateUrlQuery } from "./network"
import { Effect } from "effect"

jest.mock("../env", () => ({
  env: {},
}))

describe("network utilities", () => {
  describe("populateUrlParams", () => {
    it("should work", () => {
      const Codec = S.struct({
        id: S.UUID,
        mode: S.string,
      })

      const result = Effect.runSync(
        populateUrlParams("/path/:id/subpath/:mode/", Codec, {
          id: "e010db10-dd93-4fff-8d1f-cfead30591fc",
          mode: "all",
        }),
      )

      expect(result).toBe(
        "/path/e010db10-dd93-4fff-8d1f-cfead30591fc/subpath/all/",
      )
    })
  })

  describe("populateUrlQuery", () => {
    const Codec = S.struct({
      direction: S.literal("forward", "backward"),
      target: S.optional(S.UUID),
      categories: S.array(S.UUID),
    })

    it("should work", () => {
      const result = Effect.runSync(
        populateUrlQuery("/whatever/", Codec, {
          direction: "forward",
          target: "e010db10-dd93-4fff-8d1f-cfead30591fc",
          categories: [],
        }),
      )

      expect(result).toBe(
        "/whatever/?direction=forward&target=e010db10-dd93-4fff-8d1f-cfead30591fc",
      )
    })

    it("should handle undefined values", () => {
      const result = Effect.runSync(
        populateUrlQuery("/whatever/", Codec, {
          direction: "forward",
          categories: [],
        }),
      )

      expect(result).toBe("/whatever/?direction=forward")
    })

    it("should handle arrays", () => {
      const result = Effect.runSync(
        populateUrlQuery("/whatever/", Codec, {
          direction: "forward",
          categories: [
            "f002488a-e530-4ea7-9227-c9e48a00e952",
            "e010db10-dd93-4fff-8d1f-cfead30591fc",
          ],
        }),
      )

      expect(result).toBe(
        "/whatever/?direction=forward&categories%5B%5D=f002488a-e530-4ea7-9227-c9e48a00e952&categories%5B%5D=e010db10-dd93-4fff-8d1f-cfead30591fc",
      )
    })
  })

  describe("decodeUrlQuery", () => {
    const Codec = S.struct({
      direction: S.literal("forward", "backward"),
      target: S.optional(S.UUID),
      categories: S.optional(S.array(S.UUID)),
    })

    it("should work", () => {
      const params = new URLSearchParams()

      params.append("direction", "forward")
      params.append("target", "e010db10-dd93-4fff-8d1f-cfead30591fc")

      const result = Effect.runSync(decodeUrlQuery(Codec, params))

      expect(result).toEqual({
        direction: "forward",
        target: "e010db10-dd93-4fff-8d1f-cfead30591fc",
      })
    })

    it("should handle arrays", () => {
      const params = new URLSearchParams()

      params.append("direction", "forward")
      params.append("categories[]", "f002488a-e530-4ea7-9227-c9e48a00e952")
      params.append("categories[]", "e010db10-dd93-4fff-8d1f-cfead30591fc")

      const result = Effect.runSync(decodeUrlQuery(Codec, params))

      expect(result).toEqual({
        direction: "forward",
        categories: [
          "f002488a-e530-4ea7-9227-c9e48a00e952",
          "e010db10-dd93-4fff-8d1f-cfead30591fc",
        ],
      })
    })
  })
})
