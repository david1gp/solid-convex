import { useParams } from "@tanstack/solid-router"

/** Route params for note demo routes, defaulting to the sample world. */
export function notePageDemoRendererStateCreate() {
  const params = useParams({ strict: false })
  return {
    orgHandle: () => params().orgHandle as string | undefined,
    teamId: () => params().teamId as string | undefined,
    projectId: () => params().projectId as string | undefined,
    noteId: () => (params().noteId as string | undefined) ?? "note-1",
  }
}
