import { v } from "convex/values"
import { vIdOrg } from "#src/org/org_convex/vIdOrg.ts"

export const teamOrgContextFields = {
  orgId: v.optional(vIdOrg),
  orgHandle: v.optional(v.string()),
} as const
