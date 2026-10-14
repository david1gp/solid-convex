import * as a from "valibot"
import { mutation } from "#convex/_generated/server.js"
import { createResult, createResultError } from "#result"
import { noteContextFields } from "#src/note/convex/noteContextFields.ts"
import { noteGetFn } from "#src/note/convex/noteGetFn.ts"
import { vIdNote } from "#src/note/convex/vIdNote.ts"
import { noteTitleDerive } from "#src/note/model/noteTitleDerive.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authMutationResult } from "#src/utils/convex_backend/authMutationResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { nowIso } from "#utils/date/nowIso.js"

const noteEditDataSchema = a.object({
  content: a.string(),
})

export const noteEditMutation = mutation({
  args: createTokenValidator({
    noteId: vIdNote,
    ...noteContextFields,
    ...valibotToConvex(noteEditDataSchema.entries),
  }),
  handler: (ctx, args) =>
    authMutationResult(ctx, args, async (ctx, data) => {
      const op = "noteEditMutation"
      const parsed = a.safeParse(noteEditDataSchema, data)
      if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
      const note = await noteGetFn(ctx, data)
      if (!note.success) return note
      const content = parsed.output.content
      const title = noteTitleDerive(content)
      await ctx.db.patch("notes", data.noteId, {
        content,
        title,
        updatedAt: nowIso(),
      })
      console.info(op, {
        noteId: data.noteId,
        projectId: note.data.projectId,
        teamId: note.data.teamId,
        orgId: note.data.orgId,
      })
      return createResult(null)
    }),
})
