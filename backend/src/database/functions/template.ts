type ArgMode = "IN" | "OUT" | "INOUT" | "VARIADIC"
type ArgVolatility = "VOLATILE" | "STABLE" | "IMMUTABLE"
type ArgParallel = "UNSAFE" | "RESTRICTED" | "SAFE"

interface FunctionTemplateArg {
  mode?: ArgMode | undefined
  name: string
  type?: string | undefined
  defaultExpr?: string | undefined
}

interface FunctionArgs {
  name: string
  args: FunctionTemplateArg[]
  returns?: string | undefined
  volatility: ArgVolatility
  leakproof: boolean
  parallel: ArgParallel
  cost?: number | undefined
  body: string
}

export interface FunctionTemplate extends Omit<FunctionArgs, "body"> {}

export function template(t: FunctionArgs): string {
  const args = t.args
    .map(
      (arg) =>
        `${arg.mode ?? "IN"} ${arg.name} ${arg.type ?? "jsonb"}${
          typeof arg.defaultExpr === "undefined" ? ` = ${arg.defaultExpr}` : ""
        }`,
    )
    .join(", ")

  return `
    DROP FUNCTION IF EXISTS ${t.name};
    CREATE OR REPLACE FUNCTION ${t.name}(${args})
    RETURNS ${t.returns ?? "jsonb"}
    LANGUAGE 'plpgsql'
    ${t.volatility}
    ${t.leakproof ? "" : "NOT "} LEAKPROOF
    PARALLEL ${t.parallel}
    COST ${t.cost ?? 100}

    AS $BODY$
    ${t.body}
    $BODY$;
  `
}
