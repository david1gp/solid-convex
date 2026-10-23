import { api } from "#convex/_generated/api.js"
import type { Id } from "#convex/_generated/dataModel.js"
import type { ActionCtx } from "#convex/_generated/server.js"
import * as a from "valibot"
import { addRouteWithCors } from "#src/auth/convex/headers/cors/addRouteWithCors.ts"
import type { HonoDispatcher } from "#src/auth/convex/headers/honoDispatcher.ts"
import { httpMethod } from "#src/auth/convex/headers/httpMethod.ts"
import { authorizationHeaderGetToken } from "#src/auth/server/authorizationHeaderGetToken.ts"
import { type ApiErrorStatus, apiError } from "#src/api/apiError.ts"
import { orgHandleSchema } from "#src/org/org_model_field/orgHandleSchema.ts"
import { orgRoleSchema } from "#src/org/org_model_field/orgRole.ts"
import { orgDataPartialSchema } from "#src/org/org_model/orgSchema.ts"
import { teamDataSchema } from "#src/team/model/teamDataSchema.ts"
import { authActionCredentialResolve } from "#src/utils/convex_backend/authActionCredentialResolve.ts"

const paginationSchema = a.object({
  numItems: a.pipe(a.number(), a.integer(), a.minValue(1), a.maxValue(100)),
  cursor: a.nullable(a.string()),
})
const routes = [
  ["/api/orgs", "GET", "org-list"],
  ["/api/orgs/get", "GET", "org-get"],
  ["/api/orgs/page", "GET", "org-page"],
  ["/api/orgs/handle-available", "GET", "handle-available"],
  ["/api/orgs/members", "GET", "member-list"],
  ["/api/orgs/members/get", "GET", "member-get"],
  ["/api/orgs/invites", "GET", "invite-list"],
  ["/api/orgs/invites/get", "GET", "invite-get"],
  ["/api/orgs/create", "POST", "org-create"],
  ["/api/orgs/update", "POST", "org-update"],
  ["/api/orgs/members/create", "POST", "member-create"],
  ["/api/orgs/members/update", "POST", "member-update"],
  ["/api/orgs/members/delete", "POST", "member-delete"],
  ["/api/orgs/leave", "POST", "leave"],
  ["/api/orgs/invites/initiate", "POST", "invite-initiate"],
  ["/api/orgs/invites/resend", "POST", "invite-resend"],
  ["/api/orgs/invites/accept", "POST", "invite-accept"],
  ["/api/orgs/invites/dismiss", "POST", "invite-dismiss"],
  ["/api/teams", "GET", "team-list"],
  ["/api/teams/get", "GET", "team-get"],
  ["/api/teams/create", "POST", "team-create"],
  ["/api/teams/update", "POST", "team-update"],
] as const

function jsonError(op: string, message: string, status: ApiErrorStatus): Response {
  return apiError.response("api-org-team", op, message, status)
}

export function addHttpRoutesApiOrgTeam(dispatcher: HonoDispatcher) {
  for (const [path, method, slug] of routes) {
    addRouteWithCors(dispatcher, path, method === "GET" ? httpMethod.GET : httpMethod.POST, async (ctx, request) => {
      const op = `apiOrgTeam:${slug}`
      const token = authorizationHeaderGetToken(request.headers.get("authorization"))
      if (!token) return jsonError(op, "Unauthorized", 401)
      let credential
      try {
        credential = await authActionCredentialResolve(ctx, token)
      } catch {
        return jsonError(op, "Unauthorized", 401)
      }
      if (!credential.success) return jsonError(op, "Unauthorized", 401)
      const parse = (schema: a.GenericSchema, value: unknown) => a.safeParse(schema, value)
      const query = Object.fromEntries(new URL(request.url).searchParams.entries())
      const bodyResult = method === "POST" ? await request.json().catch(() => null) : query
      if (bodyResult === null) return jsonError(op, "Invalid JSON body", 400)
      const run = async (fn: (args: never) => Promise<unknown>, args: unknown) => {
        try {
          return Response.json(await fn(args as never))
        } catch {
          return jsonError(op, "Request failed", 500)
        }
      }
      const handle = parse(orgHandleSchema, query.orgHandle)
      switch (path) {
        case "/api/orgs": {
          const p = query.numItems
            ? parse(paginationSchema, { numItems: Number(query.numItems), cursor: query.cursor ?? null })
            : undefined
          if (p && !p.success) return jsonError(op, "Invalid pagination", 400)
          return run(ctx.runQuery.bind(ctx, api.org.orgListQuery) as never, {
            token,
            paginationOpts: p?.success ? p.output : undefined,
          })
        }
        case "/api/orgs/get":
        case "/api/orgs/page":
        case "/api/orgs/handle-available":
          if (!handle.success) return jsonError(op, "Invalid orgHandle", 400)
          if (path.endsWith("/get"))
            return run(ctx.runQuery.bind(ctx, api.org.orgGetQuery) as never, {
              token,
              orgHandle: handle.output,
              updatedAt: query.updatedAt,
            })
          if (path.endsWith("/page"))
            return run(ctx.runQuery.bind(ctx, api.org.orgGetPageQuery) as never, { token, orgHandle: handle.output })
          return run(ctx.runQuery.bind(ctx, api.org.orgHandleAvailableQuery) as never, {
            token,
            orgHandle: handle.output,
          })
        case "/api/orgs/members":
        case "/api/orgs/invites": {
          if (!handle.success) return jsonError(op, "Invalid orgHandle", 400)
          const p = query.numItems
            ? parse(paginationSchema, { numItems: Number(query.numItems), cursor: query.cursor ?? null })
            : undefined
          if (p && !p.success) return jsonError(op, "Invalid pagination", 400)
          const fn = path.includes("members") ? api.org.orgMembersListQuery : api.org.orgInvitationsListQuery
          return run(ctx.runQuery.bind(ctx, fn) as never, {
            token,
            orgHandle: handle.output,
            paginationOpts: p?.success ? p.output : undefined,
          })
        }
        case "/api/orgs/members/get":
          if (!handle.success || typeof query.memberId !== "string") return jsonError(op, "Invalid member query", 400)
          return run(ctx.runQuery.bind(ctx, api.org.orgMemberGetQuery) as never, {
            token,
            orgHandle: handle.output,
            memberId: query.memberId,
            updatedAt: query.updatedAt,
          })
        case "/api/orgs/invites/get":
          if (typeof query.invitationCode !== "string") return jsonError(op, "Invalid invitationCode", 400)
          return run(ctx.runQuery.bind(ctx, api.org.orgInvitationGetQuery) as never, {
            invitationCode: query.invitationCode,
            orgHandle: query.orgHandle,
            updatedAt: query.updatedAt,
          })
        case "/api/teams":
        case "/api/teams/get": {
          const args = {
            token,
            orgId: query.orgId as Id<"orgs"> | undefined,
            orgHandle: query.orgHandle,
            paginationOpts: query.numItems
              ? { numItems: Number(query.numItems), cursor: query.cursor ?? null }
              : undefined,
            teamId: query.teamId,
          }
          return path.endsWith("/get")
            ? run(ctx.runQuery.bind(ctx, api.team.teamGetQuery) as never, args)
            : run(ctx.runQuery.bind(ctx, api.team.teamListQuery) as never, args)
        }
      }
      if (method !== "POST") return jsonError(op, "Not found", 404)
      const body = bodyResult as Record<string, unknown>
      const postHandle = parse(orgHandleSchema, body.orgHandle)
      const role = parse(orgRoleSchema, body.role)
      switch (path) {
        case "/api/orgs/create":
        case "/api/orgs/update": {
          const validation = parse(orgDataPartialSchema, body)
          if (!postHandle.success || !validation.success) return jsonError(op, "Invalid organization", 400)
          return run(
            ctx.runMutation.bind(
              ctx,
              path.endsWith("create") ? api.org.orgCreateMutation : api.org.orgEditMutation,
            ) as never,
            { ...(validation.output as Record<string, unknown>), orgHandle: postHandle.output, token },
          )
        }
        case "/api/orgs/members/create":
          if (!postHandle.success || typeof body.userId !== "string" || !role.success)
            return jsonError(op, "Invalid member", 400)
          return run(ctx.runMutation.bind(ctx, api.org.orgMemberCreateMutation) as never, {
            token,
            orgHandle: postHandle.output,
            userId: body.userId as Id<"users">,
            role: role.output,
          })
        case "/api/orgs/members/update":
        case "/api/orgs/members/delete":
          if (
            !postHandle.success ||
            typeof body.memberId !== "string" ||
            (path.endsWith("update") && body.role !== undefined && !role.success)
          )
            return jsonError(op, "Invalid member", 400)
          return run(
            ctx.runMutation.bind(
              ctx,
              path.endsWith("update") ? api.org.orgMemberEditMutation : api.org.orgMemberDeleteMutation,
            ) as never,
            {
              token,
              orgHandle: postHandle.output,
              memberId: body.memberId,
              ...(path.endsWith("update") ? { role: body.role } : {}),
            },
          )
        case "/api/orgs/leave":
          if (!postHandle.success) return jsonError(op, "Invalid orgHandle", 400)
          return run(ctx.runMutation.bind(ctx, api.org.orgLeaveMutation) as never, {
            token,
            orgHandle: postHandle.output,
          })
        case "/api/orgs/invites/initiate":
          if (
            !postHandle.success ||
            typeof body.invitedName !== "string" ||
            typeof body.invitedEmail !== "string" ||
            !role.success ||
            !["en", "ru", "tj"].includes(String(body.l))
          )
            return jsonError(op, "Invalid invitation", 400)
          return run(ctx.runMutation.bind(ctx, api.org.orgInvitation20InitMutation) as never, {
            ...body,
            token,
            orgHandle: postHandle.output,
            role: role.output,
          })
        case "/api/orgs/invites/resend":
        case "/api/orgs/invites/accept":
        case "/api/orgs/invites/dismiss":
          if (typeof body.invitationCode !== "string") return jsonError(op, "Invalid invitationCode", 400)
          if (path.endsWith("resend"))
            return run(ctx.runAction.bind(ctx, api.org.orgInvitation30ResendAction) as never, {
              token,
              invitationCode: body.invitationCode,
              l: body.l,
            })
          if (path.endsWith("accept"))
            return run(ctx.runMutation.bind(ctx, api.org.orgInvitation50AcceptMutation) as never, {
              token,
              invitationCode: body.invitationCode,
              orgHandle: body.orgHandle,
            })
          return run(ctx.runMutation.bind(ctx, api.org.orgInvitation60DismissMutation) as never, {
            token,
            invitationCode: body.invitationCode,
          })
        case "/api/teams/create":
        case "/api/teams/update": {
          const validation = parse(teamDataSchema, body)
          if (!validation.success) return jsonError(op, "Invalid team", 400)
          const args = {
            token,
            ...(validation.output as Record<string, unknown>),
            orgId: body.orgId as Id<"orgs"> | undefined,
            orgHandle: body.orgHandle,
            teamId: body.teamId as Id<"teams"> | undefined,
          }
          if (path.endsWith("update") && typeof body.teamId !== "string") return jsonError(op, "Invalid teamId", 400)
          return run(
            ctx.runMutation.bind(
              ctx,
              path.endsWith("create") ? api.team.teamCreateMutation : api.team.teamEditMutation,
            ) as never,
            args,
          )
        }
      }
      return jsonError(op, "Not found", 404)
    })
  }
  return dispatcher
}
