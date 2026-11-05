import { readFile } from "node:fs/promises"
import * as v from "valibot"
import { e2eCheckpointSchema } from "./e2eCheckpointSchema.ts"
import type { E2eOwnedResource } from "./e2eOwnedResourceSchema.ts"
import { e2eCheckpointWrite } from "./e2eCheckpointWrite.ts"

let registrations = Promise.resolve()

/** Register immediately after creating a run-owned resource; IDs should start with `e2e-${runId}-`. */
export async function e2eOwnedResourceRegister(
  resource: Omit<E2eOwnedResource, "ownerRunId" | "createdAt">,
  environment: Record<string, string | undefined> = process.env,
): Promise<void> {
  const registration = registrations.then(() => e2eOwnedResourceRegisterWrite(resource, environment))
  registrations = registration.then(
    () => undefined,
    () => undefined,
  )
  await registration
}

async function e2eOwnedResourceRegisterWrite(
  resource: Omit<E2eOwnedResource, "ownerRunId" | "createdAt">,
  environment: Record<string, string | undefined>,
): Promise<void> {
  const checkpointPath = environment.E2E_CHECKPOINT_PATH
  if (!checkpointPath) throw new Error("E2E_CHECKPOINT_PATH is required to register an owned E2E resource")
  const raw = await readFile(checkpointPath, "utf8")
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch (error) {
    throw new Error("Cannot register a resource against invalid E2E checkpoint JSON", { cause: error })
  }
  const parsed = v.safeParse(e2eCheckpointSchema, value)
  if (!parsed.success) throw new Error("Cannot register a resource against an invalid E2E checkpoint")
  if (
    environment.E2E_RUN_ID !== parsed.output.runId ||
    !resource.resourceId.startsWith(`e2e-${parsed.output.runId}-`)
  ) {
    throw new Error("Owned E2E resource IDs must use the e2e-<runId>- prefix")
  }
  if (
    resource.resourceType === "auth-session" &&
    (!resource.sessionProof ||
      resource.resourceId !== `e2e-${parsed.output.runId}-session-${resource.sessionProof.sessionId}` ||
      resource.sessionProof.creationTime < parsed.output.createdAt ||
      Date.parse(resource.sessionProof.createdAt) < parsed.output.createdAt)
  )
    throw new Error("Owned auth sessions require exact session ownership proof")
  const existing = parsed.output.ownedResources.find((entry) => entry.resourceId === resource.resourceId)
  if (existing) {
    if (
      existing.resourceType !== resource.resourceType ||
      JSON.stringify(existing.sessionProof) !== JSON.stringify(resource.sessionProof)
    )
      throw new Error("Owned resource identity changed")
    return
  }
  await e2eCheckpointWrite(checkpointPath, {
    ...parsed.output,
    ownedResources: [
      ...parsed.output.ownedResources,
      { ...resource, ownerRunId: parsed.output.runId, createdAt: resource.sessionProof?.creationTime ?? Date.now() },
    ],
  })
}
