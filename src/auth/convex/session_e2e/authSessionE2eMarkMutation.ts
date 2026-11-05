import { v } from "convex/values"
import * as a from "valibot"
import { mutation } from "#convex/_generated/server.js"
import { createResult, createResultError } from "#result"
import { authSessionE2eCallerAuthorize } from "./authSessionE2eCallerAuthorize.ts"
import { authSessionE2eOwnershipSchema } from "./authSessionE2eOwnershipSchema.ts"

export const authSessionE2eMarkMutation = mutation({
  args: { token: v.string(), e2eRunId: v.string(), ownedAt: v.number() },
  handler: async (ctx, { token, ...ownership }) => {
    const op = "authSessionE2eMarkMutation"
    const parsed = a.safeParse(authSessionE2eOwnershipSchema, ownership)
    if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
    const authorized = await authSessionE2eCallerAuthorize(ctx, token)
    if (!authorized.success) return authorized

    // No target token/session ID argument: the credential itself must identify exactly one row.
    const matches = await ctx.db
      .query("authSessions")
      .withIndex("token", (q) => q.eq("token", token))
      .take(2)
    const session = matches[0]
    if (matches.length !== 1 || !session || session.userId !== authorized.data.userId || session.deletedAt) {
      return createResultError(op, "Current session could not be uniquely identified")
    }
    const now = Date.now()
    if (!Number.isFinite(Date.parse(session.expiresAt)) || Date.parse(session.expiresAt) <= now)
      return createResultError(op, "Current session is expired or invalid")
    if (
      !Number.isFinite(Date.parse(session.createdAt)) ||
      ownership.ownedAt > now ||
      ownership.ownedAt > session._creationTime ||
      ownership.ownedAt > Date.parse(session.createdAt)
    ) {
      return createResultError(op, "Session predates the original E2E run creation")
    }
    if (
      (session.e2eRunId !== undefined || session.e2eOwnedAt !== undefined) &&
      (session.e2eRunId !== ownership.e2eRunId || session.e2eOwnedAt !== ownership.ownedAt)
    ) {
      return createResultError(op, "Session already has different immutable E2E ownership")
    }
    if (session.e2eRunId === undefined) {
      await ctx.db.patch("authSessions", session._id, {
        e2eRunId: ownership.e2eRunId,
        e2eOwnedAt: ownership.ownedAt,
      })
      console.info(op, { sessionId: session._id, e2eRunId: ownership.e2eRunId })
    }
    return createResult({
      sessionId: session._id,
      userId: session.userId,
      e2eRunId: ownership.e2eRunId,
      ownedAt: ownership.ownedAt,
      createdAt: session.createdAt,
      creationTime: session._creationTime,
    })
  },
})
