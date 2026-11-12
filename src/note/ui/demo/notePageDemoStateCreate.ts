import { useLocation, useNavigate, useParams } from "@tanstack/solid-router"
import { createMemo } from "solid-js"
import type { Note } from "#src/note/model/noteSchema.ts"
import { noteTitleDerive } from "#src/note/model/noteTitleDerive.ts"
import { notePageDemoFixturesGet } from "#src/note/ui/demo/notePageDemoFixturesGet.ts"
import { notePageDemoHref } from "#src/note/ui/demo/notePageDemoHref.ts"
import type { notePageStateCreate } from "#src/note/ui/notePageStateCreate.ts"
import { projectPageDemoFixturesGet } from "#src/project/ui/demo/projectPageDemoFixturesGet.ts"
import { projectPageDemoHref } from "#src/project/ui/demo/projectPageDemoHref.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

type NotePageState = ReturnType<typeof notePageStateCreate>

function paginationStub(): NotePageState["pagination"] {
  return {
    page: () => undefined,
    result: () => undefined,
    canNext: () => false,
    canPrevious: () => false,
    next: () => {},
    previous: () => {},
    loading: () => false,
    cursor: () => null,
    history: () => [],
    reset: () => {},
  }
}

/** Local-only note page state: fixture notes and demo hrefs, no Convex or storage.
 * Saves update the in-memory fixtures and report a local status; nothing is sent. */
export function notePageDemoStateCreate(): NotePageState {
  const params = useParams({ strict: false })
  const location = useLocation()
  const navigate = useNavigate()
  const fixtures = notePageDemoFixturesGet()
  const projectFixtures = projectPageDemoFixturesGet()

  const orgHandle = () => params().orgHandle as string | undefined
  const teamId = () => params().teamId as string | undefined
  const projectId = () => params().projectId as string | undefined
  const noteId = () => params().noteId as string | undefined

  const isCreate = () => location().pathname.endsWith("/create") || params().noteId === "create"
  const selectedNoteId = () => {
    const id = noteId()
    return id && id !== "create" ? id : undefined
  }

  const scopeContext = () => ({ orgHandle: orgHandle(), teamId: teamId(), projectId: projectId() })

  const notes = () => {
    const all = fixtures.notes()
    if (projectId()) return all.filter((note) => note.projectId === projectId())
    if (teamId()) return all.filter((note) => note.teamId === teamId())
    return all
  }

  const currentNote = () => {
    const id = selectedNoteId()
    return id ? fixtures.get(id) : undefined
  }

  const availableProjects = () => {
    const all = projectFixtures.projects()
    return teamId() ? all.filter((project) => project.teamId === teamId()) : all
  }

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
        const targetProject = projectFixtures.get(targetProjectId)
        const note = fixtures.add({
          content,
          title: noteTitleDerive(content),
          projectId: targetProjectId,
          teamId: teamId() ?? targetProject?.teamId ?? "team-1",
        })
        saveStatusSignal.set("Note created locally — demo only, nothing was sent.")
        await navigate({
          to: notePageDemoHref("detail", { ...scopeContext(), projectId: targetProjectId, noteId: note.noteId }),
        })
      } else {
        const id = selectedNoteId()
        if (!id) return
        const updated = fixtures.edit(id, { content, title: noteTitleDerive(content) })
        if (!updated) {
          saveErrorSignal.set("Note is no longer available in the local demo.")
          return
        }
        saveStatusSignal.set("Note saved locally — demo only, nothing was sent.")
      }
    } finally {
      isSavingSignal.set(false)
    }
  }

  const deleteDialogOpen = createSignalObject(false)
  const deleteTarget = createMemo(() => {
    const id = selectedNoteId()
    return id ? { kind: "note" as const, noteId: id as Note["noteId"] } : undefined
  })
  const onDeleteSuccess = () => {
    const id = selectedNoteId()
    if (id) fixtures.remove(id)
    void navigate({ to: notePageDemoHref("list", scopeContext()) })
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
    pagination: paginationStub(),
    notes,
    listError: () => "",
    currentNote,
    noteLoading: () => false,
    noteError: () => "",
    availableProjects,
    saveNote,
    isSaving: () => isSavingSignal.get(),
    saveStatus: () => saveStatusSignal.get(),
    saveError: () => saveErrorSignal.get(),
    createHref: () => notePageDemoHref("create", scopeContext()),
    listHref: () => notePageDemoHref("list", scopeContext()),
    noteItemHref: (noteItem: { noteId: string; projectId: string }) =>
      notePageDemoHref("detail", {
        ...scopeContext(),
        projectId: projectId() ?? noteItem.projectId,
        noteId: noteItem.noteId,
      }),
    projectHref: () => {
      const pid = projectId()
      return pid
        ? projectPageDemoHref("detail", { orgHandle: orgHandle(), teamId: teamId(), projectId: pid })
        : undefined
    },
    onSelectProjectForNewNote: (event: Event & { currentTarget: HTMLSelectElement }) => {
      const targetProjectId = event.currentTarget.value
      if (!targetProjectId) return
      void navigate({
        to: notePageDemoHref("create", { ...scopeContext(), projectId: targetProjectId }),
      })
    },
  }
}
