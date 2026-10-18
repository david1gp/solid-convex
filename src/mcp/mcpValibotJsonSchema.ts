import * as a from "valibot"

export type JsonSchema = Record<string, unknown>

type ValibotInternals = {
  type?: string
  pipe?: readonly { type?: string; requirement?: unknown }[]
  options?: readonly unknown[]
  enum?: Record<string, string>
  wrapped?: unknown
  entries?: Record<string, unknown>
  item?: unknown
  literal?: unknown
}

function asInternals(schema: a.GenericSchema<unknown>): ValibotInternals {
  return schema as unknown as ValibotInternals
}

function isOptionalSchema(schema: a.GenericSchema<unknown>): boolean {
  return asInternals(schema).type === "optional"
}

function convertInner(schema: a.GenericSchema<unknown>): JsonSchema {
  const internals = asInternals(schema)
  switch (internals.type) {
    case "string": {
      // Model schemas may add trim/nonEmpty/length/regex refinements; the wire shape
      // stays a plain string so tools/list is identical to the previous Zod output.
      return { type: "string" }
    }
    case "number": {
      let integer = false
      const result: JsonSchema = { type: "number" }
      for (const pipe of internals.pipe ?? []) {
        if (pipe.type === "integer") {
          integer = true
          result.maximum = 9007199254740991
        }
        if ((pipe.type === "min_value" || pipe.type === "minimum") && typeof pipe.requirement === "number")
          result.minimum = pipe.requirement
        if ((pipe.type === "max_value" || pipe.type === "maximum") && typeof pipe.requirement === "number")
          result.maximum = pipe.requirement
      }
      if (integer) result.type = "integer"
      return result
    }
    case "boolean":
      return { type: "boolean" }
    case "literal":
      return { type: "string", const: internals.literal }
    case "picklist":
      return { type: "string", enum: [...((internals.options ?? []) as readonly unknown[])] }
    case "enum":
      return { type: "string", enum: [...Object.values(internals.enum ?? {})] }
    case "optional":
      return convertInner(internals.wrapped as a.GenericSchema<unknown>)
    case "nullable": {
      const wrapped = convertInner(internals.wrapped as a.GenericSchema<unknown>)
      if (Array.isArray(wrapped.type)) {
        return { ...wrapped, type: [...(wrapped.type as string[]), "null"] }
      }
      if (Array.isArray(wrapped.anyOf)) {
        return { anyOf: [...(wrapped.anyOf as JsonSchema[]), { type: "null" }] }
      }
      if (typeof wrapped.type === "string") {
        return { ...wrapped, type: [wrapped.type, "null"] }
      }
      return { anyOf: [wrapped, { type: "null" }] }
    }
    case "union":
    case "variant": {
      const options = (internals.options ?? []) as readonly a.GenericSchema<unknown>[]
      return { oneOf: options.map((option) => convertInner(option)) }
    }
    case "object": {
      const entries = (internals.entries ?? {}) as Record<string, a.GenericSchema<unknown>>
      const properties: Record<string, JsonSchema> = {}
      const required: string[] = []
      for (const [key, entry] of Object.entries(entries)) {
        properties[key] = convertInner(entry)
        if (!isOptionalSchema(entry)) required.push(key)
      }
      const result: JsonSchema = { type: "object", properties }
      if (required.length > 0) result.required = required
      return result
    }
    case "array":
      return { type: "array", items: convertInner(internals.item as a.GenericSchema<unknown>) }
    default:
      return {}
  }
}

export function valibotToJsonSchema(schema: a.GenericSchema<unknown>): JsonSchema {
  const converted = convertInner(schema)
  // Tools without parameters keep the historical shape (no $schema key), matching
  // the SDK's empty-object constant previously used for ping/server-info.
  if (
    converted.type === "object" &&
    converted.properties !== undefined &&
    Object.keys(converted.properties as Record<string, unknown>).length === 0 &&
    converted.required === undefined
  ) {
    return converted
  }
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    ...converted,
  }
}
