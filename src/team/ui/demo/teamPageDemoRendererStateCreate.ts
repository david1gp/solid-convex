import { useParams } from "@tanstack/solid-router"

/** Route params for team demo routes, defaulting to the sample world. */
export function teamPageDemoRendererStateCreate() {
  const params = useParams({ strict: false })
  return {
    orgHandle: () => params().orgHandle as string | undefined,
    teamId: () => (params().teamId as string | undefined) ?? "team-1",
  }
}
