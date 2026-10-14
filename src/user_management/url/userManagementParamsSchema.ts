import * as a from "valibot"
import { stringSchemaId } from "#src/utils/valibot/stringSchema.ts"

export const userManagementParamsSchema = a.object({
  userId: a.optional(stringSchemaId),
})

export type UserManagementParams = a.InferOutput<typeof userManagementParamsSchema>
