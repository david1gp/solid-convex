import * as a from "valibot"
import { mutation } from "#convex/_generated/server.js"
import { createResult, createResultError } from "#result"
import { noteDataSchema } from "#src/note/model/noteDataSchema.ts"
import { noteTitleDerive } from "#src/note/model/noteTitleDerive.ts"
import { projectContextFields } from "#src/project/convex/projectContextFields.ts"
import { projectGetFn } from "#src/project/convex/projectGetFn.ts"
import { vIdProject } from "#src/project/convex/vIdProject.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authMutationResult } from "#src/utils/convex_backend/authMutationResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { nowIso } from "#utils/date/nowIso.js"

export const noteCreateMutation = mutation({
  args: createTokenValidator({
    projectId: vIdProject,
    ...projectContextFields,
    ...valibotToConvex(noteDataSchema.entries),
  }),
  handler: (ctx, args) =>
    authMutationResult(ctx, args, async (ctx, data) => {
      const op = "noteCreateMutation"
      const parsed = a.safeParse(noteDataSchema, data)
      if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
      const project = await projectGetFn(ctx, data)
      if (!project.success) return project
      const now = nowIso()
      const content = parsed.output.content
      const title = noteTitleDerive(content)
      const noteId = await ctx.db.insert("notes", {
        projectId: project.data.projectId,
        teamId: project.data.teamId,
        orgId: project.data.orgId,
        content,
        title,
        createdAt: now,
        updatedAt: now,
      })
      console.info(op, {
        noteId,
        projectId: project.data.projectId,
        teamId: project.data.teamId,
        orgId: project.data.orgId,
      })
      return createResult(noteId)
    }),
})
