import { v } from "convex/values"

export const vAssignmentTarget = v.union(
  v.object({ kind: v.literal("organization"), id: v.string() }),
  v.object({ kind: v.literal("team"), id: v.string() }),
  v.object({ kind: v.literal("project"), id: v.string() }),
  v.object({ kind: v.literal("note"), id: v.string() }),
)
