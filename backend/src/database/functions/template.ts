import * as S from "@effect/schema/Schema"

const ArgMode = S.literal("IN", "OUT", "INOUT", "VARIADIC")
const ArgVolatility = S.literal("VOLATILE", "STABLE", "IMMUTABLE")
const ArgParallel = S.literal("UNSAFE", "RESTRICTED", "SAFE")

const FunctionTemplateArg = S.struct({
  mode: ArgMode,
  name: S.string.pipe(S.nonEmpty()),
  type: S.string.pipe(S.nonEmpty()),
  defaultExpr: S.nullable(S.string.pipe(S.nonEmpty())),
})

const FunctionArgs = S.struct({
  name: S.string.pipe(S.nonEmpty()),
  args: S.array(FunctionTemplateArg),
  returns: S.string.pipe(S.nonEmpty()),
  volatility: ArgVolatility,
  leakproof: S.boolean,
  parallel: ArgParallel,
  cost: S.nullable(S.number.pipe(S.int()).pipe(S.greaterThanOrEqualTo(0))),
  body: S.string.pipe(S.nonEmpty()),
})

interface FunctionArgs extends S.Schema.To<typeof FunctionArgs> {}

export const FunctionTemplate = FunctionArgs.pipe(S.omit("body"))

export interface FunctionTemplate
  extends S.Schema.To<typeof FunctionTemplate> {}

export function template(t: FunctionArgs): string {
  const args = t.args
    .map((arg) => {
      const defaultExpr =
        arg.defaultExpr === null ? "" : ` = ${arg.defaultExpr}`

      return `${arg.mode} ${arg.name} ${arg.type}${defaultExpr}`
    })
    .join(", ")

  const cost = t.cost ?? 100

  return `
    DROP FUNCTION IF EXISTS ${t.name};
    CREATE OR REPLACE FUNCTION ${t.name}(${args})
    RETURNS ${t.returns}
    LANGUAGE 'plpgsql'
    ${t.volatility}
    ${t.leakproof ? "" : "NOT "} LEAKPROOF
    PARALLEL ${t.parallel}
    COST ${cost}

    AS $BODY$
    ${t.body}
    $BODY$;
  `
}
