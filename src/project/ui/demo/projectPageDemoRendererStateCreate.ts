import { useParams } from "@tanstack/solid-router"

/** Route params for project demo routes, defaulting to the sample world. */
export function projectPageDemoRendererStateCreate() {
  const params = useParams({ strict: false })
  return {
    orgHandle: () => params().orgHandle as string | undefined,
    teamId: () => params().teamId as string | undefined,
    projectId: () => (params().projectId as string | undefined) ?? "project-1",
  }
}
