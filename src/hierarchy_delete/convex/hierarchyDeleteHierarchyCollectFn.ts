import type { Id } from "#convex/_generated/dataModel.js"
import type { MutationCtx, QueryCtx } from "#convex/_generated/server.js"
import type { HierarchyDeleteResolvedRoot } from "#src/hierarchy_delete/model/hierarchyDeleteResolvedRootSchema.ts"

export interface HierarchyDeleteHierarchyCollected {
  orgIds: Set<string>
  teamIds: Set<string>
  projectIds: Set<string>
  noteIds: Set<string>
  isTruncated: boolean
}

export async function hierarchyDeleteHierarchyCollectFn(
  ctx: QueryCtx | MutationCtx,
  root: HierarchyDeleteResolvedRoot,
  maxItems = 1000,
): Promise<HierarchyDeleteHierarchyCollected> {
  const orgIds = new Set<string>()
  const teamIds = new Set<string>()
  const projectIds = new Set<string>()
  const noteIds = new Set<string>()
  let isTruncated = false

  const countTotal = () => orgIds.size + teamIds.size + projectIds.size + noteIds.size

  if (root.kind === "org") {
    orgIds.add(root.id)

    // 1. Teams in org (bounded read via .take)
    const remainingTeams = Math.max(0, maxItems - countTotal())
    if (remainingTeams <= 0) {
      isTruncated = true
    } else {
      const teams = await ctx.db
        .query("teams")
        .withIndex("orgId", (q) => q.eq("orgId", root.id as Id<"orgs">))
        .take(remainingTeams + 1)

      if (teams.length > remainingTeams) {
        isTruncated = true
      }
      for (const team of teams.slice(0, remainingTeams)) {
        teamIds.add(team._id)
      }
    }

    // 2. Projects in org (bounded read via .take)
    const remainingProjects = Math.max(0, maxItems - countTotal())
    if (remainingProjects <= 0) {
      isTruncated = true
    } else {
      const projects = await ctx.db
        .query("projects")
        .withIndex("orgId", (q) => q.eq("orgId", root.id as Id<"orgs">))
        .take(remainingProjects + 1)

      if (projects.length > remainingProjects) {
        isTruncated = true
      }
      for (const project of projects.slice(0, remainingProjects)) {
        projectIds.add(project._id)
      }
    }

    // 3. Notes in org (bounded read via .take)
    const remainingNotes = Math.max(0, maxItems - countTotal())
    if (remainingNotes <= 0) {
      isTruncated = true
    } else {
      const notes = await ctx.db
        .query("notes")
        .withIndex("orgId", (q) => q.eq("orgId", root.id as Id<"orgs">))
        .take(remainingNotes + 1)

      if (notes.length > remainingNotes) {
        isTruncated = true
      }
      for (const note of notes.slice(0, remainingNotes)) {
        noteIds.add(note._id)
      }
    }
  } else if (root.kind === "team") {
    teamIds.add(root.id)

    // 1. Projects in team (bounded read via .take)
    const remainingProjects = Math.max(0, maxItems - countTotal())
    if (remainingProjects <= 0) {
      isTruncated = true
    } else {
      const projects = await ctx.db
        .query("projects")
        .withIndex("teamId", (q) => q.eq("teamId", root.id as Id<"teams">))
        .take(remainingProjects + 1)

      if (projects.length > remainingProjects) {
        isTruncated = true
      }
      for (const project of projects.slice(0, remainingProjects)) {
        projectIds.add(project._id)
      }
    }

    // 2. Notes in team (bounded read via .take)
    const remainingNotes = Math.max(0, maxItems - countTotal())
    if (remainingNotes <= 0) {
      isTruncated = true
    } else {
      const notes = await ctx.db
        .query("notes")
        .withIndex("teamId", (q) => q.eq("teamId", root.id as Id<"teams">))
        .take(remainingNotes + 1)

      if (notes.length > remainingNotes) {
        isTruncated = true
      }
      for (const note of notes.slice(0, remainingNotes)) {
        noteIds.add(note._id)
      }
    }
  } else if (root.kind === "project") {
    projectIds.add(root.id)

    // Notes in project (bounded read via .take)
    const remainingNotes = Math.max(0, maxItems - countTotal())
    if (remainingNotes <= 0) {
      isTruncated = true
    } else {
      const notes = await ctx.db
        .query("notes")
        .withIndex("projectId", (q) => q.eq("projectId", root.id as Id<"projects">))
        .take(remainingNotes + 1)

      if (notes.length > remainingNotes) {
        isTruncated = true
      }
      for (const note of notes.slice(0, remainingNotes)) {
        noteIds.add(note._id)
      }
    }
  } else if (root.kind === "note") {
    noteIds.add(root.id)
  }

  return {
    orgIds,
    teamIds,
    projectIds,
    noteIds,
    isTruncated,
  }
}
