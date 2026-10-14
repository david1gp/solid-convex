import { useParams } from "@tanstack/solid-router"
import { createMemo } from "solid-js"
import { projectParamsParse } from "#src/project/url/projectParamsParse.ts"
import { teamHrefGet } from "#src/team/ui/teamHrefGet.ts"

export function projectListPageStateCreate() {
  const rawParams = useParams({ strict: false })
  const parsedParams = createMemo(() => {
    const res = projectParamsParse(rawParams())
    return res.success ? res.data : {}
  })
  const orgHandle = () => parsedParams().orgHandle
  const teamId = () => parsedParams().teamId
  return {
    orgHandle,
    teamId,
    orgHref: () => (orgHandle() ? `/org/${encodeURIComponent(orgHandle()!)}` : "/org"),
    teamHref: () => teamHrefGet("detail", orgHandle(), teamId()),
  }
}
