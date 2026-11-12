import { notePageDemoHref } from "#src/note/ui/demo/notePageDemoHref.ts"
import { notePageDemoStateCreate } from "#src/note/ui/demo/notePageDemoStateCreate.ts"
import { NotePage } from "#src/note/ui/NotePage.tsx"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.tsx"

function NotePageDemo() {
  const state = notePageDemoStateCreate()
  return (
    <>
      <nav class="flex flex-wrap gap-3 my-4">
        <LinkButtonInternal to={notePageDemoHref("list")}>Notes demo</LinkButtonInternal>
      </nav>
      <NotePage demo={state} />
    </>
  )
}

/** Opt-in map: caller mounts only these isolated entries inside the demo boundary. */
export const notePageDemoRendererMap = {
  "/note/create": NotePageDemo,
  "/org/:orgHandle/note/create": NotePageDemo,
  "/team/:teamId/note/create": NotePageDemo,
  "/org/:orgHandle/team/:teamId/note/create": NotePageDemo,
  "/project/:projectId/note/create": NotePageDemo,
  "/org/:orgHandle/project/:projectId/note/create": NotePageDemo,
  "/team/:teamId/project/:projectId/note/create": NotePageDemo,
  "/org/:orgHandle/team/:teamId/project/:projectId/note/create": NotePageDemo,
  "/note/:noteId/edit": NotePageDemo,
  "/org/:orgHandle/note/:noteId/edit": NotePageDemo,
  "/team/:teamId/note/:noteId/edit": NotePageDemo,
  "/org/:orgHandle/team/:teamId/note/:noteId/edit": NotePageDemo,
  "/project/:projectId/note/:noteId/edit": NotePageDemo,
  "/org/:orgHandle/project/:projectId/note/:noteId/edit": NotePageDemo,
  "/team/:teamId/project/:projectId/note/:noteId/edit": NotePageDemo,
  "/org/:orgHandle/team/:teamId/project/:projectId/note/:noteId/edit": NotePageDemo,
  "/note/:noteId": NotePageDemo,
  "/org/:orgHandle/note/:noteId": NotePageDemo,
  "/team/:teamId/note/:noteId": NotePageDemo,
  "/org/:orgHandle/team/:teamId/note/:noteId": NotePageDemo,
  "/project/:projectId/note/:noteId": NotePageDemo,
  "/org/:orgHandle/project/:projectId/note/:noteId": NotePageDemo,
  "/team/:teamId/project/:projectId/note/:noteId": NotePageDemo,
  "/org/:orgHandle/team/:teamId/project/:projectId/note/:noteId": NotePageDemo,
  "/note": NotePageDemo,
  "/org/:orgHandle/note": NotePageDemo,
  "/team/:teamId/note": NotePageDemo,
  "/org/:orgHandle/team/:teamId/note": NotePageDemo,
  "/project/:projectId/note": NotePageDemo,
  "/org/:orgHandle/project/:projectId/note": NotePageDemo,
  "/team/:teamId/project/:projectId/note": NotePageDemo,
  "/org/:orgHandle/team/:teamId/project/:projectId/note": NotePageDemo,
} as const
