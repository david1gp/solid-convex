import { api } from "#convex/_generated/api.js"
import * as a from "valibot"
import { addRouteWithCors } from "#src/auth/convex/headers/cors/addRouteWithCors.ts"
import type { HonoDispatcher } from "#src/auth/convex/headers/honoDispatcher.ts"
import { httpMethod } from "#src/auth/convex/headers/httpMethod.ts"
import { authorizationHeaderGetToken } from "#src/auth/server/authorizationHeaderGetToken.ts"
import { apiError } from "#src/api/apiError.ts"
import { authActionCredentialResolve } from "#src/utils/convex_backend/authActionCredentialResolve.ts"
import { projectDataSchema } from "#src/project/model/projectDataSchema.ts"
import { noteDataSchema } from "#src/note/model/noteDataSchema.ts"
import { resourceDataSchema, resourceSchema } from "#src/resource/model/resourceSchema.ts"
import { resourceIdSchema } from "#src/resource/model/resourceIdSchema.ts"
import { fileSchema } from "#src/file/model/fileSchema.ts"
import { resourceListHttpHandler } from "#src/resource/convex/resourceListHttpHandler.ts"
import { r2FileCreateHttpHandler } from "#src/r2/convex/r2FileCreateHttpHandler.ts"

const getRoutes = [
  "/api/projects",
  "/api/projects/get",
  "/api/notes",
  "/api/notes/get",
  "/api/resources/get",
  "/api/resources/delete-preview",
  "/api/resources/files",
  "/api/files/list",
  "/api/files/get",
]
const postRoutes = [
  "/api/projects/create",
  "/api/projects/update",
  "/api/notes/create",
  "/api/notes/update",
  "/api/resources/create",
  "/api/resources/update",
  "/api/resources/delete",
  "/api/resources/file-add",
  "/api/resources/file-remove",
  "/api/files/edit",
  "/api/files/delete",
]

const jsonError = (op: string, message: string, code: string): Response => apiError.response(code, op, message)

export function addHttpRoutesApiProjectNoteResourceFile(dispatcher: HonoDispatcher) {
  addRouteWithCors(dispatcher, "/api/resources/list", httpMethod.GET, resourceListHttpHandler)
  addRouteWithCors(dispatcher, "/api/files/create", httpMethod.POST, r2FileCreateHttpHandler)
  for (const path of [...getRoutes, ...postRoutes]) {
    const method = getRoutes.includes(path) ? httpMethod.GET : httpMethod.POST
    addRouteWithCors(dispatcher, path, method, async (ctx, request) => {
      const op = `apiProjectNoteResource:${path}`
      const token = authorizationHeaderGetToken(request.headers.get("authorization"))
      if (!token) return jsonError(op, "Unauthorized", "api-project-note-resource.unauthorized")
      try {
        const credential = await authActionCredentialResolve(ctx, token)
        if (!credential.success) return jsonError(op, "Unauthorized", "api-project-note-resource.unauthorized")
      } catch {
        return jsonError(op, "Unauthorized", "api-project-note-resource.unauthorized")
      }
      const query = Object.fromEntries(new URL(request.url).searchParams.entries())
      const body = method === httpMethod.POST ? await request.json().catch(() => null) : query
      if (body === null || typeof body !== "object")
        return jsonError(op, "Invalid JSON body", "api-project-note-resource.bad-request")
      const values = body as Record<string, unknown>
      const run = async (fn: (args: never) => Promise<unknown>, args: unknown) => {
        try {
          return Response.json(await fn(args as never))
        } catch {
          return jsonError(op, "Request failed", "api-project-note-resource.internal")
        }
      }
      const context = { token, ...values }
      if (path.startsWith("/api/projects")) {
        if (path === "/api/projects" || path.endsWith("/get")) {
          if (path.endsWith("/get") && typeof values.projectId !== "string")
            return jsonError(op, "Invalid projectId", "api-project-note-resource.bad-request")
          return run(
            ctx.runQuery.bind(
              ctx,
              path.endsWith("/get") ? api.project.projectGetQuery : api.project.projectListQuery,
            ) as never,
            path.endsWith("/get")
              ? context
              : { token, orgId: query.orgId, orgHandle: query.orgHandle, teamId: query.teamId },
          )
        }
        const parsed = a.safeParse(projectDataSchema, values)
        if (
          !parsed.success ||
          (path.endsWith("update") && typeof values.projectId !== "string") ||
          (path.endsWith("create") && typeof values.teamId !== "string")
        )
          return jsonError(op, "Invalid project", "api-project-note-resource.bad-request")
        return run(
          ctx.runMutation.bind(
            ctx,
            path.endsWith("create") ? api.project.projectCreateMutation : api.project.projectEditMutation,
          ) as never,
          context,
        )
      }
      if (path.startsWith("/api/notes")) {
        if (path === "/api/notes" || path.endsWith("/get")) {
          if (path.endsWith("/get") && typeof values.noteId !== "string")
            return jsonError(op, "Invalid noteId", "api-project-note-resource.bad-request")
          return run(
            ctx.runQuery.bind(ctx, path.endsWith("/get") ? api.note.noteGetQuery : api.note.noteListQuery) as never,
            path.endsWith("/get")
              ? context
              : {
                  token,
                  projectId: query.projectId,
                  teamId: query.teamId,
                  orgId: query.orgId,
                  orgHandle: query.orgHandle,
                },
          )
        }
        const parsed = a.safeParse(noteDataSchema, values)
        if (
          !parsed.success ||
          (path.endsWith("update") && typeof values.noteId !== "string") ||
          (path.endsWith("create") && typeof values.projectId !== "string")
        )
          return jsonError(op, "Invalid note", "api-project-note-resource.bad-request")
        return run(
          ctx.runMutation.bind(
            ctx,
            path.endsWith("create") ? api.note.noteCreateMutation : api.note.noteEditMutation,
          ) as never,
          context,
        )
      }
      if (path.startsWith("/api/resources")) {
        if (path === "/api/resources/get" || path.endsWith("delete-preview") || path.endsWith("/files")) {
          const id = a.safeParse(resourceIdSchema, values.resourceId)
          if (!id.success) return jsonError(op, "Invalid resourceId", "api-project-note-resource.bad-request")
          const fn = path.endsWith("delete-preview")
            ? api.resource.resourceDeletePreviewQuery
            : path.endsWith("/files")
              ? api.resource.resourceFilesGetQuery
              : api.resource.resourceGetQuery
          return run(ctx.runQuery.bind(ctx, fn) as never, { ...context, resourceId: id.output })
        }
        if (path.endsWith("file-add") || path.endsWith("file-remove")) {
          if (typeof values.resourceId !== "string" || typeof values.fileId !== "string")
            return jsonError(op, "Invalid resource file link", "api-project-note-resource.bad-request")
          return run(
            ctx.runMutation.bind(
              ctx,
              path.endsWith("file-add")
                ? api.resource.resourceFileAddMutation
                : api.resource.resourceFileRemoveMutation,
            ) as never,
            context,
          )
        }
        const id = a.safeParse(resourceIdSchema, values.resourceId)
        const parsed = a.safeParse(resourceDataSchema, values)
        if (!parsed.success || !id.success)
          return jsonError(op, "Invalid resource", "api-project-note-resource.bad-request")
        const fn = path.endsWith("create")
          ? api.resource.resourceCreateMutation
          : path.endsWith("update")
            ? api.resource.resourceEditMutation
            : api.resource.resourceDeleteMutation
        return run(ctx.runMutation.bind(ctx, fn) as never, context)
      }
      if (path === "/api/files/list") return run(ctx.runQuery.bind(ctx, api.file.filesListQuery) as never, { token })
      if (path === "/api/files/get") {
        if (typeof values.fileId !== "string")
          return jsonError(op, "Invalid fileId", "api-project-note-resource.bad-request")
        return run(ctx.runQuery.bind(ctx, api.file.fileGetQuery) as never, context)
      }
      if (path === "/api/files/edit" || path === "/api/files/delete") {
        if (typeof values.fileId !== "string")
          return jsonError(op, "Invalid fileId", "api-project-note-resource.bad-request")
        if (path.endsWith("edit") && !a.safeParse(fileSchema, values).success)
          return jsonError(op, "Invalid file", "api-project-note-resource.bad-request")
        return run(
          ctx.runMutation.bind(
            ctx,
            path.endsWith("edit") ? api.file.fileEditMutation : api.file.fileDeleteMutation,
          ) as never,
          context,
        )
      }
      return jsonError(op, "Not found", "api-project-note-resource.not-found")
    })
  }
  return dispatcher
}
