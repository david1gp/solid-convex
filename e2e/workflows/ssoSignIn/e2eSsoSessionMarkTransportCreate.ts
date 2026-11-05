import { createHash } from "node:crypto"
import { ConvexHttpClient } from "convex/browser"
import type { FunctionArgs } from "convex/server"
import * as v from "valibot"
import { api } from "#convex/_generated/api.js"
import { createResult, createResultError, type Result } from "#result"
import { type E2eSsoSessionProof, e2eSsoSessionProofSchema } from "./e2eSsoSessionProofSchema.ts"

const responseSchema = v.variant("success", [
  v.object({
    success: v.literal(true),
    data: v.strictObject(v.omit(e2eSsoSessionProofSchema, ["tokenDigest"]).entries),
  }),
  v.object({ success: v.literal(false), op: v.string(), errorMessage: v.string() }),
])

/** Only the current browser credential is sent. Never look up another user's token. */
export function e2eSsoSessionMarkTransportCreate(config: {
  backendUrl: string
  client?: {
    mutation: (
      reference: typeof api.auth.authSessionE2eMarkMutation,
      args: FunctionArgs<typeof api.auth.authSessionE2eMarkMutation>,
    ) => Promise<unknown>
  }
}) {
  return async (input: {
    token: string
    userId: string
    e2eRunId: string
    ownedAt: number
  }): Promise<Result<E2eSsoSessionProof>> => {
    const op = "e2eSsoSessionMarkTransportCreate"
    let raw: unknown
    try {
      const client = config.client ?? new ConvexHttpClient(config.backendUrl)
      raw = await client.mutation(api.auth.authSessionE2eMarkMutation, {
        token: input.token,
        e2eRunId: input.e2eRunId,
        ownedAt: input.ownedAt,
      })
    } catch {
      // SDK errors and bodies may contain mutation arguments, including the token.
      return createResultError(op, "Session ownership mutation invocation failed")
    }
    const parsed = v.safeParse(responseSchema, raw)
    if (!parsed.success) return createResultError(op, "Invalid session ownership mutation response")
    if (!parsed.output.success) return createResultError(parsed.output.op, parsed.output.errorMessage)
    const proof = parsed.output.data
    if (
      proof.userId !== input.userId ||
      proof.e2eRunId !== input.e2eRunId ||
      proof.ownedAt !== input.ownedAt ||
      proof.creationTime < input.ownedAt ||
      Date.parse(proof.createdAt) < input.ownedAt
    )
      return createResultError(op, "Session ownership mutation returned mismatched ownership")
    return createResult({ ...proof, tokenDigest: createHash("sha256").update(input.token).digest("hex") })
  }
}
