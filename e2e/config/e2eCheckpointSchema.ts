import * as v from "valibot"
import { e2eSsoWorkflowStateSchema } from "../workflows/ssoSignIn/e2eSsoWorkflowStateSchema.ts"
import { e2eOwnedResourceSchema } from "./e2eOwnedResourceSchema.ts"

export const e2eCheckpointSchema = v.pipe(
  v.strictObject({
    version: v.literal(1),
    environment: v.picklist(["production", "dev"]),
    baseUrl: v.pipe(v.string(), v.url()),
    runId: v.pipe(v.string(), v.minLength(1)),
    createdAt: v.number(),
    completedSuiteIds: v.array(v.string()),
    ownedResources: v.array(e2eOwnedResourceSchema),
    ssoSignIn: v.optional(e2eSsoWorkflowStateSchema),
  }),
  v.check((checkpoint) => {
    for (const resource of checkpoint.ownedResources) {
      if (resource.resourceType !== "auth-session") {
        if (resource.sessionProof) return false
        continue
      }
      const proof = resource.sessionProof
      if (
        !proof ||
        resource.ownerRunId !== checkpoint.runId ||
        resource.resourceId !== `e2e-${checkpoint.runId}-session-${proof.sessionId}` ||
        resource.createdAt !== proof.creationTime ||
        resource.createdAt < checkpoint.createdAt ||
        !Number.isFinite(Date.parse(proof.createdAt)) ||
        Date.parse(proof.createdAt) < checkpoint.createdAt
      )
        return false
    }
    const state = checkpoint.ssoSignIn
    if (!state) return true
    if (new Set(state.attempts.map((attempt) => attempt.attemptId)).size !== state.attempts.length) return false
    return state.attempts.every((attempt) => {
      if (attempt.startedAt < checkpoint.createdAt) return false
      if (!attempt.sessionResourceId) return true
      const resource = checkpoint.ownedResources.find((entry) => entry.resourceId === attempt.sessionResourceId)
      return (
        !!resource?.sessionProof &&
        resource.resourceType === "auth-session" &&
        resource.ownerRunId === checkpoint.runId &&
        resource.resourceId === `e2e-${checkpoint.runId}-session-${resource.sessionProof.sessionId}` &&
        resource.createdAt === resource.sessionProof.creationTime &&
        resource.createdAt >= attempt.startedAt &&
        Date.parse(resource.sessionProof.createdAt) >= attempt.startedAt &&
        !attempt.baselineSessionIds.includes(resource.sessionProof.sessionId) &&
        attempt.browser?.userId === resource.sessionProof.userId &&
        attempt.browser?.tokenDigest === resource.sessionProof.tokenDigest
      )
    })
  }, "Invalid SSO session intent/ownership evidence"),
)

export type E2eCheckpoint = v.InferOutput<typeof e2eCheckpointSchema>
