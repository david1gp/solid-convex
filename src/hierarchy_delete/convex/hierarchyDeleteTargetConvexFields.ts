import { v } from "convex/values"
import { vIdNote } from "#src/note/convex/vIdNote.ts"
import { vIdOrg } from "#src/org/org_convex/vIdOrg.ts"
import { vIdProject } from "#src/project/convex/vIdProject.ts"
import { vIdTeam } from "#src/team/convex/vIdTeam.ts"

export const hierarchyDeleteTargetConvexFields = {
  kind: v.union(v.literal("org"), v.literal("team"), v.literal("project"), v.literal("note")),
  orgId: v.optional(vIdOrg),
  orgHandle: v.optional(v.string()),
  teamId: v.optional(vIdTeam),
  projectId: v.optional(vIdProject),
  noteId: v.optional(vIdNote),
  limit: v.optional(v.number()),
} as const
