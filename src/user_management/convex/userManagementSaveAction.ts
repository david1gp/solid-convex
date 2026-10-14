import { v } from "convex/values"
import { internal } from "#convex/_generated/api.js"
import { action } from "#convex/_generated/server.js"
import { createResult, createResultError } from "#result"
import type { PromiseResult } from "#result"
import type { UserRole } from "#src/auth/model_field/userRole.ts"
import { zitadelServerConfigFromEnv } from "#src/user_management/server/zitadelServerConfigFromEnv.ts"
import { zitadelUserAssignmentSave } from "#src/user_management/server/zitadelUserAssignmentSave.ts"
import type { ZitadelUserAssignmentPartialFailure } from "#src/user_management/server/ZitadelUserAssignmentPartialFailure.ts"
import type { ZitadelUserAssignmentSaveResult } from "#src/user_management/server/ZitadelUserAssignmentSaveResult.ts"
import { zitadelUserGet } from "#src/user_management/server/zitadelUserGet.ts"
import { zitadelUserGrantList } from "#src/user_management/server/zitadelUserGrantList.ts"
import { zitadelUserTeamIdsGet } from "#src/user_management/server/zitadelUserTeamIdsGet.ts"

export const userManagementSaveAction = action({
  args: {
    token: v.string(),
    userId: v.string(),
    organizationId: v.optional(v.string()),
    roles: v.optional(v.array(v.string())),
    teamIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args): PromiseResult<ZitadelUserAssignmentSaveResult> => {
    const op = "userManagementSaveAction"

    // 1. Verify admin from database session
    const adminCheck = await ctx.runQuery(internal.userManagement.userManagementAdminCheckInternalQuery, {
      token: args.token,
    })
    if (!adminCheck.success) {
      return adminCheck
    }

    // 2. Validate team IDs exist
    if (args.teamIds !== undefined && args.teamIds.length > 0) {
      const teamsCheck = await ctx.runQuery(internal.userManagement.userManagementTeamsValidateInternalQuery, {
        teamIds: args.teamIds,
      })
      if (!teamsCheck.success) {
        return teamsCheck
      }
    }

    // 3. Resolve Zitadel server config
    const configResult = zitadelServerConfigFromEnv()
    if (!configResult.success) {
      return configResult
    }
    const config = configResult.data
    const organizationId = args.organizationId ?? config.organizationId

    // 4. Target organization verify before ANY save: reject foreign or missing user IDs
    const verifyResult = await zitadelUserGet({
      config,
      userId: args.userId,
      organizationId,
    })
    if (!verifyResult.success) {
      return verifyResult
    }
    const userSummary = verifyResult.data

    // 5. Save to Zitadel
    const saveResult = await zitadelUserAssignmentSave({
      config,
      userId: args.userId,
      roles: args.roles as readonly UserRole[] | undefined,
      teamIds: args.teamIds,
    })

    let partialFailure: ZitadelUserAssignmentPartialFailure | undefined
    if (!saveResult.success && saveResult.errorData) {
      try {
        partialFailure = JSON.parse(saveResult.errorData) as ZitadelUserAssignmentPartialFailure
      } catch {
        // Ignored
      }
    }

    const rolesWereUpdated =
      args.roles !== undefined && (saveResult.success || (partialFailure !== undefined && partialFailure.rolesUpdated))

    const teamIdsWereUpdated =
      args.teamIds !== undefined &&
      (saveResult.success || (partialFailure !== undefined && partialFailure.teamIdsUpdated))

    // If completely failed, do not write fabricated or optimistic state to projection
    if (!saveResult.success && !rolesWereUpdated && !teamIdsWereUpdated) {
      return saveResult
    }

    // 6. Reconcile only successful authority reads; fail required reads never fallback to requested values
    const [grantsReadback, teamIdsReadback] = await Promise.all([
      zitadelUserGrantList({
        config,
        userId: args.userId,
        projectId: config.projectId,
      }),
      zitadelUserTeamIdsGet({
        config,
        userId: args.userId,
      }),
    ])

    if (rolesWereUpdated && !grantsReadback.success) {
      return createResultError(op, `Failed to read back authority user grants: ${grantsReadback.errorMessage}`)
    }
    if (teamIdsWereUpdated && !teamIdsReadback.success) {
      return createResultError(op, `Failed to read back authority team IDs: ${teamIdsReadback.errorMessage}`)
    }

    const authorityRoles = grantsReadback.success
      ? grantsReadback.data
          .filter((g) => g.userId === args.userId)
          .flatMap((g) => g.roleKeys)
          .filter((k) => k === "admin" || k === "member" || k === "user")
      : []

    const authorityTeamIds = teamIdsReadback.success ? teamIdsReadback.data : []

    // 7. Immediate local roles update on actual successful role change/re-read to prevent stale admin
    if (rolesWereUpdated) {
      await ctx.runMutation(internal.userManagement.userManagementAuthUserRolesSyncInternalMutation, {
        providerSubject: args.userId,
        roles: authorityRoles,
      })
    }

    // 8. Reconcile projection with composite identity
    const syncedAt = new Date().toISOString()
    await ctx.runMutation(internal.userManagement.userProjectionUpsertInternalMutation, {
      userId: args.userId,
      organizationId,
      username: userSummary.username,
      preferredLoginName: userSummary.preferredLoginName,
      displayName: userSummary.displayName,
      email: userSummary.email,
      state: userSummary.state,
      isHuman: userSummary.isHuman,
      roles: authorityRoles,
      teamIds: [...authorityTeamIds],
      syncedAt,
    })

    // 9. Surface partial failure status if external write was not completely successful
    if (!saveResult.success) {
      return saveResult
    }

    return createResult(saveResult.data)
  },
})
