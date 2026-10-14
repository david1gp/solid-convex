import { v } from "convex/values"
import * as a from "valibot"
import { type ActionCtx, internalAction } from "#convex/_generated/server.js"
import type { PromiseResult } from "#result"
import { type R2ObjectDeleteOutput, r2ObjectDelete } from "#src/r2/api_r2/r2ObjectDelete.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"

const r2ObjectDeleteSchemaFields = { fileId: a.string() } as const
export const r2ObjectDeleteFields = valibotToConvex(r2ObjectDeleteSchemaFields)

export type R2ObjectDeleteValidatorType = typeof r2ObjectDeleteValidator.type
export const r2ObjectDeleteValidator = v.object(r2ObjectDeleteFields)

export const r2ObjectDeleteInternalAction = internalAction({
  args: r2ObjectDeleteValidator,
  handler: r2ObjectDeleteActionFn,
})

export async function r2ObjectDeleteActionFn(
  _ctx: ActionCtx,
  args: R2ObjectDeleteValidatorType,
): PromiseResult<R2ObjectDeleteOutput> {
  return r2ObjectDelete(args.fileId)
}
