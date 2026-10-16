import { v } from "convex/values"
import * as a from "valibot"
import { internalQuery, type QueryCtx, query } from "#convex/_generated/server.js"
import type { PromiseResult } from "#result"
import { r2ApiGetUploadUrl } from "#src/r2/api_r2/r2ApiGetUploadUrl.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authQueryResult } from "#src/utils/convex_backend/authQueryResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"

const r2UploadUrlGetSchemaFields = { fileId: a.string() } as const
export const r2UploadUrlGetFields = valibotToConvex(r2UploadUrlGetSchemaFields)

export type R2UploadUrlGetValidatorType = typeof r2UploadUrlGetValidator.type
export const r2UploadUrlGetValidator = v.object(r2UploadUrlGetFields)

export const r2UploadUrlGetFieldsWithToken = createTokenValidator(r2UploadUrlGetFields)

export const r2UploadUrlGetQuery = query({
  args: r2UploadUrlGetFieldsWithToken,
  handler: async (ctx, args) => authQueryResult(ctx, args, r2UploadUrlGetFn),
})

export const r2UploadUrlGetInternalQuery = internalQuery({
  args: r2UploadUrlGetValidator,
  handler: r2UploadUrlGetFn,
})

export async function r2UploadUrlGetFn(ctx: QueryCtx, args: R2UploadUrlGetValidatorType): PromiseResult<string> {
  return r2ApiGetUploadUrl(args.fileId)
}
