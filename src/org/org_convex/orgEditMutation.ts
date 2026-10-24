import { v } from "convex/values"
import * as a from "valibot"
import { type MutationCtx, mutation } from "#convex/_generated/server.js"
import { createError, createResult, createResultError, type PromiseResult } from "#result"
import type { DocOrg } from "#src/org/org_convex/IdOrg.ts"
import { orgGetByHandleFn } from "#src/org/org_convex/orgGetByHandleFn.ts"
import { orgDataSchemaFields } from "#src/org/org_model/orgSchema.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authMutationResult } from "#src/utils/convex_backend/authMutationResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { nowIso } from "#utils/date/nowIso.js"

export type OrgEditValidatorType = typeof orgEditValidator.type

export const orgEditFields = valibotToConvex(orgDataSchemaFields)

export const orgEditValidator = v.object(orgEditFields)

export const orgEditMutation = mutation({
  args: createTokenValidator(orgEditFields),
  handler: async (ctx, args) => authMutationResult(ctx, args, orgEditMutationFn),
})

export async function orgEditMutationFn(ctx: MutationCtx, args: OrgEditValidatorType): PromiseResult<null> {
  const op = "orgEditFn"

  const schema = a.partial(a.object(orgDataSchemaFields))
  const parse = a.safeParse(schema, args)
  if (!parse.success) {
    return createError(op, a.summarize(parse.issues))
  }

  const org = await orgGetByHandleFn(ctx, args.orgHandle)
  if (!org) {
    return createResultError(op, "Org not found", args.orgHandle)
  }
  const { orgHandle, ...partial } = args
  const patch: Partial<DocOrg> = partial
  patch.updatedAt = nowIso()

  await ctx.db.patch("orgs", org._id, patch)
  console.info(op, { orgHandle: args.orgHandle })
  return createResult(null)
}
