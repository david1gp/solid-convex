import type { DatabaseReader } from "#convex/_generated/server.js"
import type { Id } from "#convex/_generated/dataModel.js"
import type { HierarchyDeleteWorkerPhase } from "#src/hierarchy_delete/model/hierarchyDeleteWorkerPhaseSchema.ts"

export async function hierarchyDeleteRootLockCheckFn(
  db: DatabaseReader,
  kind: "org" | "team" | "project" | "note",
  id: string,
  jobId: string,
  phase?: HierarchyDeleteWorkerPhase,
): Promise<boolean> {
  if (kind === "org") {
    const doc = await db.get("orgs", id as Id<"orgs">)
    if (!doc) {
      return phase === "delete_org_roots" || phase === "completed"
    }
    return Boolean(doc.deleting && doc.deletionJobId === jobId)
  }
  if (kind === "team") {
    const doc = await db.get("teams", id as Id<"teams">)
    if (!doc) {
      return (
        phase === "delete_teams" ||
        phase === "delete_org_members" ||
        phase === "delete_org_roots" ||
        phase === "completed"
      )
    }
    return Boolean(doc.deleting && doc.deletionJobId === jobId)
  }
  if (kind === "project") {
    const doc = await db.get("projects", id as Id<"projects">)
    if (!doc) {
      return (
        phase === "delete_projects" ||
        phase === "cleanup_teams_zitadel" ||
        phase === "delete_teams" ||
        phase === "delete_org_members" ||
        phase === "delete_org_roots" ||
        phase === "completed"
      )
    }
    return Boolean(doc.deleting && doc.deletionJobId === jobId)
  }
  if (kind === "note") {
    const doc = await db.get("notes", id as Id<"notes">)
    if (!doc) {
      return (
        phase === "delete_notes" ||
        phase === "delete_projects" ||
        phase === "cleanup_teams_zitadel" ||
        phase === "delete_teams" ||
        phase === "delete_org_members" ||
        phase === "delete_org_roots" ||
        phase === "completed"
      )
    }
    return Boolean(doc.deleting && doc.deletionJobId === jobId)
  }
  return false
}
