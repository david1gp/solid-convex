import { v } from "convex/values"
import * as a from "valibot"
import { type MutationCtx, mutation } from "#convex/_generated/server.js"
import { createError, createResult, type PromiseResult } from "#result"
import type { IdOrg } from "#src/org/org_convex/IdOrg.ts"
import { orgHandleAvailableQueryFn } from "#src/org/org_convex/orgHandleAvailableQuery.ts"
import { orgDataSchemaFields } from "#src/org/org_model/orgSchema.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authMutationResult } from "#src/utils/convex_backend/authMutationResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { nowIso } from "#utils/date/nowIso.js"

export type OrgCreateValidatorType = typeof orgCreateValidator.type

export const orgCreateFields = valibotToConvex(orgDataSchemaFields)

export const orgCreateValidator = v.object(orgCreateFields)

export const orgCreateMutation = mutation({
  args: createTokenValidator(orgCreateFields),
  handler: async (ctx, args) => authMutationResult(ctx, args, orgCreateMutationFn),
})

export async function orgCreateMutationFn(ctx: MutationCtx, args: OrgCreateValidatorType): PromiseResult<IdOrg> {
  const op = "orgCreateFn"
  const now = nowIso()

  const schema = a.object(orgDataSchemaFields)
  const parse = a.safeParse(schema, args)
  if (!parse.success) {
    return createError(op, a.summarize(parse.issues))
  }

  const handleAvailableResult = await orgHandleAvailableQueryFn(ctx, {
    orgHandle: args.orgHandle,
  })
  if (!handleAvailableResult.success) return handleAvailableResult
  if (!handleAvailableResult.data) {
    const errorMessage = "Handle not available, please try a different one"
    return createError(op, errorMessage, args.orgHandle)
  }

  const orgId = await ctx.db.insert("orgs", {
    ...args,
    createdAt: now,
    updatedAt: now,
  })
  console.info(op, { orgId, orgHandle: args.orgHandle })
  return createResult(orgId)
}
