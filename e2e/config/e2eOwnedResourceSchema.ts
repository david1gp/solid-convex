import * as v from "valibot"
import { e2eSsoSessionProofSchema } from "../workflows/ssoSignIn/e2eSsoSessionProofSchema.ts"

export const e2eOwnedResourceSchema = v.strictObject({
  resourceType: v.pipe(v.string(), v.minLength(1)),
  resourceId: v.pipe(v.string(), v.minLength(1)),
  ownerRunId: v.pipe(v.string(), v.minLength(1)),
  createdAt: v.number(),
  sessionProof: v.optional(e2eSsoSessionProofSchema),
})

export type E2eOwnedResource = v.InferOutput<typeof e2eOwnedResourceSchema>
