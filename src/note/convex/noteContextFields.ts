import { v } from "convex/values"
import { projectContextFields } from "#src/project/convex/projectContextFields.ts"
import { vIdProject } from "#src/project/convex/vIdProject.ts"

export const noteContextFields = {
  ...projectContextFields,
  projectId: v.optional(vIdProject),
} as const
