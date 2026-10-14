import { useParams } from "@tanstack/solid-router"
import { createMemo } from "solid-js"
import { teamParamsParse } from "#src/team/url/teamParamsParse.ts"

export function teamListPageStateCreate() {
  const rawParams = useParams({ strict: false })
  const parsedParams = createMemo(() => {
    const res = teamParamsParse(rawParams())
    return res.success ? res.data : {}
  })
  const orgHandle = () => parsedParams().orgHandle
  return {
    orgHandle,
    orgHref: () => (orgHandle() ? `/org/${encodeURIComponent(orgHandle()!)}` : "/org"),
  }
}
