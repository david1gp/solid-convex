import { api } from "#convex/_generated/api.js"
import type { Id } from "#convex/_generated/dataModel.js"
import { userSessionSignal, userTokenGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import { noteSchema } from "#src/note/model/noteSchema.ts"
import { noteHrefGet } from "#src/note/ui/noteHrefGet.ts"
import { cursorPaginationCreate } from "#src/utils/convex_client/cursorPaginationCreate.ts"

export function noteListSectionStateCreate(
  orgHandle: () => string | undefined,
  teamId: () => string | undefined,
  projectId: () => string | undefined,
) {
  const pagination = cursorPaginationCreate({
    query: api.note.noteListQuery,
    queryKey: "noteListQuery",
    args: () => ({
      token: userTokenGet(),
      orgHandle: orgHandle(),
      teamId: teamId() ? (teamId() as Id<"teams">) : undefined,
      projectId: projectId() ? (projectId() as Id<"projects">) : undefined,
    }),
    identity: () => userSessionSignal.get()?.profile.userId ?? null,
    scope: () => `${orgHandle() ?? ""}:${teamId() ?? ""}:${projectId() ?? ""}`,
    itemSchema: noteSchema,
  })

  return {
    pagination,
    notes: () => {
      const result = pagination.page()
      return result?.success ? result.data.page : []
    },
    error: () => {
      const result = pagination.page()
      return result && !result.success ? result.errorMessage : ""
    },
    createHref: () =>
      noteHrefGet("create", {
        orgHandle: orgHandle(),
        teamId: teamId(),
        projectId: projectId(),
      }),
    allNotesHref: () =>
      noteHrefGet("list", {
        orgHandle: orgHandle(),
        teamId: teamId(),
        projectId: projectId(),
      }),
    detailHref: (noteId: string) =>
      noteHrefGet("detail", {
        orgHandle: orgHandle(),
        teamId: teamId(),
        projectId: projectId(),
        noteId,
      }),
  }
}
