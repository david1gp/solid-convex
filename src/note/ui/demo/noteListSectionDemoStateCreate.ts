import { notePageDemoFixturesGet } from "#src/note/ui/demo/notePageDemoFixturesGet.ts"
import { notePageDemoHref } from "#src/note/ui/demo/notePageDemoHref.ts"
import type { noteListSectionStateCreate } from "#src/note/ui/noteListSectionStateCreate.ts"

type NoteListSectionState = ReturnType<typeof noteListSectionStateCreate>

function paginationStub(): NoteListSectionState["pagination"] {
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

/** Local-only note list state: fixture notes and demo hrefs, no Convex or storage. */
export function noteListSectionDemoStateCreate(
  orgHandle: () => string | undefined,
  teamId: () => string | undefined,
  projectId: () => string | undefined,
): NoteListSectionState {
  const fixtures = notePageDemoFixturesGet()
  const context = () => ({ orgHandle: orgHandle(), teamId: teamId(), projectId: projectId() })
  const notes = () => {
    const all = fixtures.notes()
    if (projectId()) return all.filter((note) => note.projectId === projectId())
    if (teamId()) return all.filter((note) => note.teamId === teamId())
    return all
  }
  return {
    pagination: paginationStub(),
    notes,
    error: () => "",
    createHref: () => notePageDemoHref("create", context()),
    allNotesHref: () => notePageDemoHref("list", context()),
    detailHref: (noteId: string) => notePageDemoHref("detail", { ...context(), noteId }),
  }
}
