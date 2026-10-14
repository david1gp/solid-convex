import * as a from "valibot"
import { createResult, createResultError, type Result } from "#result"
import {
  type UserManagementParams,
  userManagementParamsSchema,
} from "#src/user_management/url/userManagementParamsSchema.ts"

export function userManagementParamsParse(input: unknown): Result<UserManagementParams> {
  const op = "userManagementParamsParse"
  const parsed = a.safeParse(userManagementParamsSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return createResult(parsed.output)
}
