import { readFile } from "node:fs/promises"
import * as v from "valibot"
import { createResult, createResultError, type Result } from "#result"
import { type E2eCheckpoint, e2eCheckpointSchema } from "../../config/e2eCheckpointSchema.ts"
import { e2eCheckpointWrite } from "../../config/e2eCheckpointWrite.ts"
import { e2eOwnedResourceRegister } from "../../config/e2eOwnedResourceRegister.ts"
import type { E2eSsoSessionProof } from "./e2eSsoSessionProofSchema.ts"

export function e2eSsoCheckpointStoreCreate(context: {
  checkpointPath: string
  runId: string
  target: "production" | "dev"
  baseUrl: string
}) {
  const op = "e2eSsoCheckpointStoreCreate"
  let originalCreatedAt: number | undefined
  const load = async (): Promise<Result<E2eCheckpoint>> => {
    let raw: unknown
    try {
      raw = JSON.parse(await readFile(context.checkpointPath, "utf8"))
    } catch {
      return createResultError(op, "Cannot read SSO checkpoint")
    }
    const parsed = v.safeParse(e2eCheckpointSchema, raw)
    if (!parsed.success) return createResultError(op, v.summarize(parsed.issues))
    const checkpoint = parsed.output
    if (
      checkpoint.runId !== context.runId ||
      checkpoint.environment !== context.target ||
      checkpoint.baseUrl !== context.baseUrl ||
      (originalCreatedAt !== undefined && checkpoint.createdAt !== originalCreatedAt)
    )
      return createResultError(op, "SSO checkpoint identity/target changed")
    originalCreatedAt = checkpoint.createdAt
    return createResult(checkpoint)
  }
  return {
    load,
    save: async (checkpoint: E2eCheckpoint): Promise<Result<void>> => {
      const current = await load()
      if (!current.success) return current
      // The parent runner owns the invocation flock; preserve append-only canonical ledgers
      // even when the workflow supplies a snapshot taken before ownership registration.
      for (const resource of checkpoint.ownedResources) {
        const existing = current.data.ownedResources.find((entry) => entry.resourceId === resource.resourceId)
        if (!existing || JSON.stringify(existing) !== JSON.stringify(resource))
          return createResultError(op, "SSO save cannot change canonical resource ownership")
      }
      try {
        await e2eCheckpointWrite(context.checkpointPath, {
          ...current.data,
          ssoSignIn: checkpoint.ssoSignIn,
        })
      } catch {
        return createResultError(op, "Cannot save SSO checkpoint")
      }
      return createResult(undefined)
    },
    register: async (proof: E2eSsoSessionProof): Promise<Result<string>> => {
      const current = await load()
      if (!current.success) return current
      if (proof.e2eRunId !== current.data.runId || proof.ownedAt !== current.data.createdAt)
        return createResultError(op, "Session proof does not match original checkpoint ownership")
      const resourceId = `e2e-${context.runId}-session-${proof.sessionId}`
      try {
        // Reuse the canonical run-ownership registration guard and atomic writer.
        await e2eOwnedResourceRegister(
          { resourceType: "auth-session", resourceId, sessionProof: proof },
          {
            E2E_CHECKPOINT_PATH: context.checkpointPath,
            E2E_RUN_ID: context.runId,
          },
        )
      } catch {
        return createResultError(op, "Cannot register SSO session ownership proof")
      }
      return createResult(resourceId)
    },
  }
}
