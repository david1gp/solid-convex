import type { MutationCtx } from "#convex/_generated/server.js"
import { createResult, type PromiseResult } from "#result"
import { hierarchyDeleteFileBatchDeleteFn } from "#src/hierarchy_delete/convex/hierarchyDeleteFileBatchDeleteFn.ts"
import { hierarchyDeleteHierarchyBatchDeleteFn } from "#src/hierarchy_delete/convex/hierarchyDeleteHierarchyBatchDeleteFn.ts"
import { hierarchyDeleteResourceBatchDeleteFn } from "#src/hierarchy_delete/convex/hierarchyDeleteResourceBatchDeleteFn.ts"
import type { HierarchyDeleteJobState } from "#src/hierarchy_delete/model/hierarchyDeleteJobStateSchema.ts"

const BATCH_SIZE = 25

export async function hierarchyDeleteWorkerDbStepFn(
  ctx: MutationCtx,
  state: HierarchyDeleteJobState,
): PromiseResult<HierarchyDeleteJobState> {
  const currentState: HierarchyDeleteJobState = {
    ...state,
    status: "in_progress",
  }

  if (currentState.phase === "delete_file_records") {
    const items = currentState.scope.fileIds
    if (items.length === 0 || currentState.cursor >= items.length) {
      return createResult({
        ...currentState,
        phase: "delete_resources",
        cursor: 0,
      })
    }
    const batch = items.slice(currentState.cursor, currentState.cursor + BATCH_SIZE)
    const result = await hierarchyDeleteFileBatchDeleteFn(ctx, batch)
    const nextCursor = currentState.cursor + result.processedCount
    if (!result.pendingSameItem && nextCursor >= items.length) {
      return createResult({
        ...currentState,
        phase: "delete_resources",
        cursor: 0,
      })
    }
    return createResult({
      ...currentState,
      cursor: nextCursor,
    })
  }

  if (currentState.phase === "delete_resources") {
    const items = currentState.scope.resourceIds
    if (items.length === 0 || currentState.cursor >= items.length) {
      return createResult({
        ...currentState,
        phase: "delete_notes",
        cursor: 0,
      })
    }
    const batch = items.slice(currentState.cursor, currentState.cursor + BATCH_SIZE)
    const result = await hierarchyDeleteResourceBatchDeleteFn(ctx, batch)
    const nextCursor = currentState.cursor + result.processedCount
    if (!result.pendingSameItem && nextCursor >= items.length) {
      return createResult({
        ...currentState,
        phase: "delete_notes",
        cursor: 0,
      })
    }
    return createResult({
      ...currentState,
      cursor: nextCursor,
    })
  }

  if (currentState.phase === "delete_notes") {
    const items = currentState.scope.noteIds
    if (items.length === 0 || currentState.cursor >= items.length) {
      return createResult({
        ...currentState,
        phase: "delete_projects",
        cursor: 0,
      })
    }
    const batch = items.slice(currentState.cursor, currentState.cursor + BATCH_SIZE)
    const result = await hierarchyDeleteHierarchyBatchDeleteFn(ctx, "notes", batch)
    const nextCursor = currentState.cursor + result.processedCount
    if (!result.pendingSameItem && nextCursor >= items.length) {
      return createResult({
        ...currentState,
        phase: "delete_projects",
        cursor: 0,
      })
    }
    return createResult({
      ...currentState,
      cursor: nextCursor,
    })
  }

  if (currentState.phase === "delete_projects") {
    const items = currentState.scope.projectIds
    if (items.length === 0 || currentState.cursor >= items.length) {
      const nextPhase = currentState.scope.teamIds.length > 0 ? "cleanup_teams_zitadel" : "delete_teams"
      return createResult({
        ...currentState,
        phase: nextPhase,
        cursor: 0,
      })
    }
    const batch = items.slice(currentState.cursor, currentState.cursor + BATCH_SIZE)
    const result = await hierarchyDeleteHierarchyBatchDeleteFn(ctx, "projects", batch)
    const nextCursor = currentState.cursor + result.processedCount
    if (!result.pendingSameItem && nextCursor >= items.length) {
      const nextPhase = currentState.scope.teamIds.length > 0 ? "cleanup_teams_zitadel" : "delete_teams"
      return createResult({
        ...currentState,
        phase: nextPhase,
        cursor: 0,
      })
    }
    return createResult({
      ...currentState,
      cursor: nextCursor,
    })
  }

  if (currentState.phase === "delete_teams") {
    const items = currentState.scope.teamIds
    if (items.length === 0 || currentState.cursor >= items.length) {
      return createResult({
        ...currentState,
        phase: "delete_org_members",
        cursor: 0,
      })
    }
    const batch = items.slice(currentState.cursor, currentState.cursor + BATCH_SIZE)
    const result = await hierarchyDeleteHierarchyBatchDeleteFn(ctx, "teams", batch)
    const nextCursor = currentState.cursor + result.processedCount
    if (!result.pendingSameItem && nextCursor >= items.length) {
      return createResult({
        ...currentState,
        phase: "delete_org_members",
        cursor: 0,
      })
    }
    return createResult({
      ...currentState,
      cursor: nextCursor,
    })
  }

  if (currentState.phase === "delete_org_members") {
    const items = currentState.scope.orgIds
    if (items.length === 0 || currentState.cursor >= items.length) {
      return createResult({
        ...currentState,
        phase: "delete_org_roots",
        cursor: 0,
      })
    }
    const batch = items.slice(currentState.cursor, currentState.cursor + BATCH_SIZE)
    const result = await hierarchyDeleteHierarchyBatchDeleteFn(ctx, "org_members", batch)
    const nextCursor = currentState.cursor + result.processedCount
    if (!result.pendingSameItem && nextCursor >= items.length) {
      return createResult({
        ...currentState,
        phase: "delete_org_roots",
        cursor: 0,
      })
    }
    return createResult({
      ...currentState,
      cursor: nextCursor,
    })
  }

  if (currentState.phase === "delete_org_roots") {
    const items = currentState.scope.orgIds
    if (items.length === 0 || currentState.cursor >= items.length) {
      return createResult({
        ...currentState,
        phase: "completed",
        cursor: 0,
        status: "completed",
      })
    }
    const batch = items.slice(currentState.cursor, currentState.cursor + BATCH_SIZE)
    const result = await hierarchyDeleteHierarchyBatchDeleteFn(ctx, "orgs", batch)
    const nextCursor = currentState.cursor + result.processedCount
    if (!result.pendingSameItem && nextCursor >= items.length) {
      return createResult({
        ...currentState,
        phase: "completed",
        cursor: 0,
        status: "completed",
      })
    }
    return createResult({
      ...currentState,
      cursor: nextCursor,
    })
  }

  if (currentState.phase === "completed") {
    return createResult({
      ...currentState,
      status: "completed",
    })
  }

  return createResult(currentState)
}
