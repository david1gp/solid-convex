import * as a from "valibot"
import { intSchemaMin0 } from "#utils/valibot/intSchema.js"

export const decodedTokenSchema = a.object({
  sub: a.string(),
  org: a.nullish(a.string()),
  iat: intSchemaMin0,
  exp: intSchemaMin0,
})

export type DecodedToken = a.InferOutput<typeof decodedTokenSchema>
