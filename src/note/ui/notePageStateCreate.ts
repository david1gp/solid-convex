import { useLocation, useParams } from "@tanstack/solid-router"
import { createEffect, createMemo } from "solid-js"
import { api } from "#convex/_generated/api.js"
import type { Id } from "#convex/_generated/dataModel.js"
import { userSessionSignal, userTokenGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import type { HierarchyDeleteTarget } from "#src/hierarchy_delete/model/hierarchyDeleteTargetSchema.ts"
import { noteSchema } from "#src/note/model/noteSchema.ts"
import { noteHrefGet } from "#src/note/ui/noteHrefGet.ts"
import { noteStorageRead } from "#src/note/ui/noteStorageRead.ts"
import { noteStorageWriterCreate } from "#src/note/ui/noteStorageWriterCreate.ts"
import { noteParamsParse } from "#src/note/url/noteParamsParse.ts"
import { projectHrefGet } from "#src/project/ui/projectHrefGet.ts"
import { cursorPaginationCreate } from "#src/utils/convex_client/cursorPaginationCreate.ts"
import { mutationCreate } from "#src/utils/convex_client/mutationCreate.ts"
import { queryCreate } from "#src/utils/convex_client/queryCreate.ts"
import { navigateTo } from "#src/utils/router/navigateTo.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

export function notePageStateCreate() {
  const rawParams = useParams({ strict: false })
  const location = useLocation()

  const parsedParams = createMemo(() => {
    const res = noteParamsParse(rawParams())
    return res.success ? res.data : {}
  })

  const orgHandle = () => parsedParams().orgHandle
  const teamId = () => parsedParams().teamId
  const projectId = () => parsedParams().projectId
  const noteId = () => parsedParams().noteId

  const isCreate = () => location().pathname.endsWith("/create") || rawParams().noteId === "create"

  const selectedNoteId = () => {
    const id = noteId()
    return id && id !== "create" ? id : undefined
  }

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

  const noteDetailQuery = queryCreate(api.note.noteGetQuery, () => {
    const id = selectedNoteId()
    if (!id) return undefined
    return {
      token: userTokenGet(),
      noteId: id,
      projectId: projectId(),
      teamId: teamId(),
      orgHandle: orgHandle(),
    }
  })

  const cacheKey = () => {
    const id = selectedNoteId()
    return id ? `note/detail/${userSessionSignal.get()?.profile.userId ?? ""}/${id}` : ""
  }

  const writer = noteStorageWriterCreate()

  createEffect(() => {
    if (!selectedNoteId()) return
    const q = noteDetailQuery()
    const key = cacheKey()
    if (q?.success && key) {
      writer.save(key, q.data)
    }
  })

  const currentNote = () => {
    if (!selectedNoteId()) return undefined
    const q = noteDetailQuery()
    if (q) return q.success ? q.data : undefined
    const key = cacheKey()
    if (!key) return undefined
    const cached = noteStorageRead(key, noteSchema)
    return cached.success ? cached.data : undefined
  }

  const projectsQuery = queryCreate(api.project.projectListQuery, () => ({
    token: userTokenGet(),
    orgHandle: orgHandle(),
    teamId: teamId() ? (teamId() as Id<"teams">) : undefined,
  }))

  const availableProjects = () => {
    const q = projectsQuery()
    return q?.success ? q.data.page : []
  }

  const editMutation = mutationCreate(api.note.noteEditMutation)
  const createMutation = mutationCreate(api.note.noteCreateMutation)
  const isSavingSignal = createSignalObject(false)
  const saveStatusSignal = createSignalObject("")
  const saveErrorSignal = createSignalObject("")

  const saveNote = async (content: string) => {
    if (isSavingSignal.get()) return
    isSavingSignal.set(true)
    saveErrorSignal.set("")
    saveStatusSignal.set("")
    try {
      if (isCreate()) {
        const targetProjectId = projectId()
        if (!targetProjectId) {
          saveErrorSignal.set("Choose a project before creating a note.")
          return
        }
        const res = await createMutation({
          token: userTokenGet(),
          projectId: targetProjectId as Id<"projects">,
          orgHandle: orgHandle(),
          teamId: teamId() ? (teamId() as Id<"teams">) : undefined,
          content,
        })
        if (!res.success) {
          saveErrorSignal.set(res.errorMessage)
          return
        }
        saveStatusSignal.set("Note created successfully")
        navigateTo(
          noteHrefGet("detail", {
            orgHandle: orgHandle(),
            teamId: teamId(),
            projectId: targetProjectId,
            noteId: String(res.data),
          }),
        )
      } else {
        const id = selectedNoteId()
        if (!id) return
        const res = await editMutation({
          token: userTokenGet(),
          noteId: id as Id<"notes">,
          orgHandle: orgHandle(),
          teamId: teamId() ? (teamId() as Id<"teams">) : undefined,
          projectId: projectId() ? (projectId() as Id<"projects">) : undefined,
          content,
        })
        if (!res.success) {
          saveErrorSignal.set(res.errorMessage)
          return
        }
        saveStatusSignal.set("Note saved")
      }
    } catch (cause) {
      saveErrorSignal.set(cause instanceof Error ? cause.message : "Save failed")
    } finally {
      isSavingSignal.set(false)
    }
  }

  const deleteDialogOpen = createSignalObject(false)
  const deleteTarget = createMemo<HierarchyDeleteTarget | undefined>(() => {
    const id = selectedNoteId()
    if (!id) return undefined
    return {
      kind: "note",
      noteId: id,
    }
  })
  const onDeleteSuccess = () => {
    navigateTo(
      noteHrefGet("list", {
        orgHandle: orgHandle(),
        teamId: teamId(),
        projectId: projectId(),
      }),
    )
  }

  return {
    orgHandle,
    teamId,
    projectId,
    noteId,
    isCreate,
    selectedNoteId,
    deleteDialogOpen,
    deleteTarget,
    onDeleteSuccess,
    pagination,
    notes: () => {
      const result = pagination.page()
      return result?.success ? result.data.page : []
    },
    listError: () => {
      const result = pagination.page()
      return result && !result.success ? result.errorMessage : ""
    },
    currentNote,
    noteLoading: () => Boolean(selectedNoteId()) && !currentNote() && !noteDetailQuery(),
    noteError: () => {
      if (!selectedNoteId()) return ""
      const q = noteDetailQuery()
      return q && !q.success ? q.errorMessage : ""
    },
    availableProjects,
    saveNote,
    isSaving: () => isSavingSignal.get(),
    saveStatus: () => saveStatusSignal.get(),
    saveError: () => saveErrorSignal.get(),
    createHref: () =>
      noteHrefGet("create", {
        orgHandle: orgHandle(),
        teamId: teamId(),
        projectId: projectId(),
      }),
    listHref: () =>
      noteHrefGet("list", {
        orgHandle: orgHandle(),
        teamId: teamId(),
        projectId: projectId(),
      }),
    noteItemHref: (noteItem: { noteId: string; projectId: string }) =>
      noteHrefGet("detail", {
        orgHandle: orgHandle(),
        teamId: teamId(),
        projectId: projectId() ?? noteItem.projectId,
        noteId: noteItem.noteId,
      }),
    projectHref: () => {
      const pId = projectId()
      return pId
        ? projectHrefGet("detail", {
            orgHandle: orgHandle(),
            teamId: teamId(),
            projectId: pId,
          })
        : undefined
    },
    onSelectProjectForNewNote: (event: Event & { currentTarget: HTMLSelectElement }) => {
      const targetProjectId = event.currentTarget.value
      if (!targetProjectId) return
      navigateTo(
        noteHrefGet("create", {
          orgHandle: orgHandle(),
          teamId: teamId(),
          projectId: targetProjectId,
        }),
      )
    },
  }
}
