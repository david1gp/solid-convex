import * as v from "valibot"
import { authSessionE2eOwnershipSchema } from "#src/auth/convex/session_e2e/authSessionE2eOwnershipSchema.ts"

/** Metadata only: the browser token is hashed in memory, never checkpointed. */
export const e2eSsoSessionProofSchema = v.strictObject({
  sessionId: v.pipe(v.string(), v.minLength(1)),
  userId: v.pipe(v.string(), v.minLength(1)),
  createdAt: v.pipe(v.string(), v.isoTimestamp()),
  creationTime: v.pipe(v.number(), v.finite(), v.minValue(1)),
  tokenDigest: v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/u)),
  ...authSessionE2eOwnershipSchema.entries,
})

export type E2eSsoSessionProof = v.InferOutput<typeof e2eSsoSessionProofSchema>
