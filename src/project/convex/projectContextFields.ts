import { v } from "convex/values"
import { teamOrgContextFields } from "#src/team/convex/teamOrgContextFields.ts"
import { vIdTeam } from "#src/team/convex/vIdTeam.ts"

export const projectContextFields = {
  ...teamOrgContextFields,
  teamId: v.optional(vIdTeam),
} as const
