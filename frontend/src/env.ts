import * as S from "@effect/schema/Schema"

const Env = S.struct({
  VITE_API_URL: S.string.pipe(S.nonEmpty()).pipe(
    S.filter(
      (url) => /^https?:\/\/[\w.-]+(?::\d+)?(?:\/[\w.-]+)*[^/]$/i.test(url),
      {
        message: () =>
          "VITE_API_URL should be a URL with protocol, host and path, with no final slash",
      },
    ),
  ),
})

interface Env extends S.Schema.To<typeof Env> {}

export const env: Env = S.encodeUnknownSync(Env)(process.env)
