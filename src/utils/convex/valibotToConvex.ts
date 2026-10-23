import { type Validator, v } from "convex/values"
import type * as a from "valibot"

/**
 * Invariant-only schema compiler: converts static valibot field definitions
 * into Convex validators at module scope. It never validates runtime input, so
 * its failures are programmer errors (unsupported schema shapes), not fallible
 * results. All such failures funnel through `invariantFail` below; callers must
 * not try/catch around these helpers.
 */
function invariantFail(message: string): never {
  throw new Error(message)
}

type Schema = a.BaseSchema<unknown, unknown, a.BaseIssue<unknown>>
type SchemaRecord = Record<string, Schema>

type UnwrapSchema<TSchema extends Schema> =
  TSchema extends a.SchemaWithPipe<infer TPipe>
    ? TPipe extends readonly [infer TFirst, ...unknown[]]
      ? TFirst extends Schema
        ? UnwrapSchema<TFirst>
        : TSchema
      : TSchema
    : TSchema

export type ConvexValidatorFromValibotSchema<TSchema extends Schema> =
  UnwrapSchema<TSchema> extends
    | a.OptionalSchema<any, any>
    | a.ExactOptionalSchema<any, any>
    | a.UndefinedableSchema<any, any>
    | a.NullishSchema<any, any>
    ? Validator<a.InferOutput<UnwrapSchema<TSchema>>, "optional", any>
    : Validator<a.InferOutput<UnwrapSchema<TSchema>>, "required", any>

export type ConvexFieldsFromValibotFields<TFields extends SchemaRecord> = {
  [K in keyof TFields]: ConvexValidatorFromValibotSchema<TFields[K]>
}

export function valibotToConvex<const TFields extends SchemaRecord>(
  fields: TFields,
): ConvexFieldsFromValibotFields<TFields> {
  return valibotFieldsToConvexFields(fields)
}

export function valibotFieldToConvexValidator<const TSchema extends Schema>(
  schema: TSchema,
): ConvexValidatorFromValibotSchema<TSchema> {
  return valibotFieldToConvexValidatorUnknown(schema as UnknownSchema) as ConvexValidatorFromValibotSchema<TSchema>
}

export function valibotFieldsToConvexFields<const TFields extends SchemaRecord>(
  fields: TFields,
): ConvexFieldsFromValibotFields<TFields> {
  const out: Record<string, Validator<any, any, any>> = {}
  for (const [key, schema] of Object.entries(fields)) {
    out[key] = valibotFieldToConvexValidatorUnknown(schema as UnknownSchema)
  }
  return out as ConvexFieldsFromValibotFields<TFields>
}

export function valibotObjectToConvexFields<const TEntries extends SchemaRecord>(
  schema: a.ObjectSchema<TEntries, any> | a.SchemaWithPipe<readonly [a.ObjectSchema<TEntries, any>, ...any[]]>,
): ConvexFieldsFromValibotFields<TEntries> {
  const unknownSchema = unwrapSchema(schema as UnknownSchema)
  if (unknownSchema.type !== "object" || !unknownSchema.entries) {
    return invariantFail("valibot-to-convex: expected an object schema")
  }
  return valibotFieldsToConvexFields(unknownSchema.entries as TEntries)
}

type UnknownSchema = {
  type: string
  wrapped?: UnknownSchema
  entries?: Record<string, UnknownSchema>
  item?: UnknownSchema
  options?: unknown[]
  pipe?: unknown[]
  key?: UnknownSchema
  value?: UnknownSchema
  literal?: unknown
  enum?: Record<string, unknown>
}

function valibotFieldToConvexValidatorUnknown(schema: UnknownSchema): Validator<any, any, any> {
  const unwrappedSchema = unwrapSchema(schema)

  switch (unwrappedSchema.type) {
    case "string":
      return v.string()
    case "number":
      return v.number()
    case "boolean":
      return v.boolean()
    case "null":
      return v.null()
    case "literal":
      return literalToConvex(unwrappedSchema.literal)
    case "enum":
      return enumToConvex(unwrappedSchema.enum)
    case "array":
      if (!unwrappedSchema.item) return invariantFail("valibot-to-convex: array schema is missing `item`")
      return v.array(valibotFieldToConvexValidatorUnknownRequired(unwrappedSchema.item))
    case "record":
      if (!unwrappedSchema.key || !unwrappedSchema.value) {
        return invariantFail("valibot-to-convex: record schema is missing `key` or `value`")
      }
      return v.record(
        valibotFieldToConvexValidatorUnknownRequired(unwrappedSchema.key),
        valibotFieldToConvexValidatorUnknownRequired(unwrappedSchema.value),
      )
    case "object":
      if (!unwrappedSchema.entries) {
        return invariantFail("valibot-to-convex: object schema is missing `entries`")
      }
      return v.object(valibotFieldsToConvexFields(unwrappedSchema.entries as SchemaRecord))
    case "optional":
    case "exact_optional":
    case "undefinedable":
      if (!unwrappedSchema.wrapped) {
        return invariantFail(`valibot-to-convex: ${unwrappedSchema.type} schema is missing \`wrapped\``)
      }
      return v.optional(valibotFieldToConvexValidatorUnknown(unwrappedSchema.wrapped))
    case "nullable":
      if (!unwrappedSchema.wrapped) {
        return invariantFail("valibot-to-convex: nullable schema is missing `wrapped`")
      }
      return v.nullable(valibotFieldToConvexValidatorUnknownRequired(unwrappedSchema.wrapped))
    case "nullish":
      if (!unwrappedSchema.wrapped) {
        return invariantFail("valibot-to-convex: nullish schema is missing `wrapped`")
      }
      return v.optional(v.nullable(valibotFieldToConvexValidatorUnknownRequired(unwrappedSchema.wrapped)))
    case "union":
      if (!Array.isArray(unwrappedSchema.options) || unwrappedSchema.options.length === 0) {
        return invariantFail("valibot-to-convex: union schema is missing `options`")
      }
      return v.union(
        ...unwrappedSchema.options.map((option) =>
          valibotFieldToConvexValidatorUnknownRequired(schemaFromOption(option)),
        ),
      )
    default:
      return invariantFail(`valibot-to-convex: unsupported valibot schema type "${unwrappedSchema.type}"`)
  }
}

function valibotFieldToConvexValidatorUnknownRequired(schema: UnknownSchema): Validator<any, "required", any> {
  return valibotFieldToConvexValidatorUnknown(schema) as Validator<any, "required", any>
}

function unwrapSchema(schema: UnknownSchema): UnknownSchema {
  if (Array.isArray(schema.pipe) && schema.pipe.length > 0 && isSchema(schema.pipe[0])) {
    return unwrapSchema(schema.pipe[0])
  }
  return schema
}

function literalToConvex(value: unknown): Validator<any, "required", any> {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return v.literal(value)
  }
  return invariantFail(`valibot-to-convex: unsupported literal type "${typeof value}"`)
}

function enumToConvex(enumObject: UnknownSchema["enum"]): Validator<any, "required", any> {
  if (!enumObject) return invariantFail("valibot-to-convex: enum schema is missing `enum`")
  const values = Object.values(enumObject)
  if (values.length === 0) return invariantFail("valibot-to-convex: enum schema has no values")
  const members = values.map((value) => literalToConvex(value))
  if (members.length === 1) {
    const member = members[0]
    if (!member) return invariantFail("valibot-to-convex: enum schema has no validator members")
    return member
  }
  return v.union(...members)
}

function isSchema(value: unknown): value is UnknownSchema {
  return !!value && typeof value === "object" && "type" in value
}

function schemaFromOption(option: unknown): UnknownSchema {
  if (!isSchema(option)) {
    return invariantFail("valibot-to-convex: union option is not a schema")
  }
  return option
}
