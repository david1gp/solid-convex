import * as a from "valibot"
import { internal } from "#convex/_generated/api.js"
import type { ActionCtx } from "#convex/_generated/server.js"
import { createResultError } from "#result"
import { apiError } from "#src/api/apiError.ts"
import { assignmentTargetSchema } from "#src/assignment/model/assignmentTargetSchema.ts"
import { authorizationHeaderGetToken } from "#src/auth/server/authorizationHeaderGetToken.ts"
import type { FileDataModelWithUserMetadata } from "#src/file/model/FileModel.ts"
import { fileSchemaFields } from "#src/file/model/fileSchema.ts"
import { resourceIdSchema } from "#src/resource/model/resourceIdSchema.ts"
import { authActionCredentialResolve } from "#src/utils/convex_backend/authActionCredentialResolve.ts"
import { stringSchemaId } from "#src/utils/valibot/stringSchema.ts"
import { jsonStringifyPretty } from "#utils/json/jsonStringifyPretty.js"

export const apiPathR2FileCreate = "/fileCreate"

const httpFileCreateSchema = a.object({
  ...fileSchemaFields,
  assignment: a.optional(a.nullable(assignmentTargetSchema)),
  orgId: a.optional(a.nullable(stringSchemaId)),
  teamId: a.optional(a.nullable(stringSchemaId)),
  projectId: a.optional(a.nullable(stringSchemaId)),
  noteId: a.optional(a.nullable(stringSchemaId)),
  resourceId: a.optional(a.nullable(resourceIdSchema)),
})

export async function r2FileCreateHttpHandler(ctx: ActionCtx, request: Request): Promise<Response> {
  const op = "r2FileCreateHttpHandler"

  const token = authorizationHeaderGetToken(request.headers.get("authorization"))
  if (!token) {
    const errorMessage = "Missing authorization header"
    console.warn(op, errorMessage)
    return apiError.fromResultError("r2", createResultError(op, errorMessage), 401)
  }

  const credentialResult = await authActionCredentialResolve(ctx, token)
  if (!credentialResult.success) {
    return apiError.fromResultError("r2", credentialResult, 401)
  }
  const userId = credentialResult.data.userId

  const user = await ctx.runQuery(internal.auth.userGetInternalQuery, {
    userId,
  })
  if (!user) {
    const errorMessage = "User not found"
    console.error(op, errorMessage)
    return apiError.fromResultError("r2", createResultError(op, errorMessage), 404)
  }

  const body = await request.json()
  const parseResult = a.safeParse(httpFileCreateSchema, body)
  if (!parseResult.success) {
    const errorMessage = a.summarize(parseResult.issues)
    console.warn(op, errorMessage)
    return apiError.fromResultError("r2", createResultError(op, errorMessage), 400)
  }

  const data = { ...parseResult.output, userId, username: user.username }

  console.log(op, "insertingFile:", data)

  const result = await ctx.runMutation(internal.file.fileCreateInternalMutation, data)
  if (!result.success) {
    console.warn(op, result)
    return apiError.fromResultError("r2", result, 400)
  }

  return new Response(jsonStringifyPretty(result))
}
