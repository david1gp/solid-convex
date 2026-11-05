import { createResult, createResultError, type Result } from "#result"
import * as v from "valibot"
import type { E2eSsoSessionObservation } from "./e2eSsoSessionObservationSchema.ts"
import { type E2eSsoSessionProof, e2eSsoSessionProofSchema } from "./e2eSsoSessionProofSchema.ts"

/** A username or newly observed session alone is NOT evidence of ownership. */
export function e2eSsoSessionOwnershipProve(input: {
  sessions: E2eSsoSessionObservation[]
  e2eRunId: string
  ownedAt: number
  baselineSessionIds: string[]
  startedAt: number
  now: number
  browser: { userId: string; tokenDigest: string }
}): Result<E2eSsoSessionProof> {
  const op = "e2eSsoSessionOwnershipProve"
  const matches = input.sessions.filter(
    (session) => session.userId === input.browser.userId && session.tokenDigest === input.browser.tokenDigest,
  )
  // JWTs can coincide for same-second logins: ambiguous/shared tokens must fail closed.
  if (matches.length !== 1) return createResultError(op, "Browser token does not uniquely identify one session")
  const proof = matches[0]!
  const parsed = v.safeParse(e2eSsoSessionProofSchema, proof)
  if (!parsed.success || proof.e2eRunId !== input.e2eRunId || proof.ownedAt !== input.ownedAt)
    return createResultError(op, "Session does not have this run's immutable backend ownership")
  if (
    !Number.isFinite(proof.creationTime) ||
    !Number.isFinite(Date.parse(proof.createdAt)) ||
    input.baselineSessionIds.includes(proof.sessionId) ||
    proof.creationTime < input.startedAt ||
    proof.creationTime > input.now ||
    Date.parse(proof.createdAt) < input.startedAt ||
    Date.parse(proof.createdAt) > input.now
  )
    return createResultError(op, "Session was not created by this browser attempt")
  return createResult(parsed.output)
}
