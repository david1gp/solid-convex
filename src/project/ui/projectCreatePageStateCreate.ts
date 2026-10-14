import { useParams } from "@tanstack/solid-router"
import { createMemo } from "solid-js"
import { projectParamsParse } from "#src/project/url/projectParamsParse.ts"

export function projectCreatePageStateCreate() {
  const rawParams = useParams({ strict: false })
  const parsedParams = createMemo(() => {
    const res = projectParamsParse(rawParams())
    return res.success ? res.data : {}
  })
  return {
    orgHandle: () => parsedParams().orgHandle,
    teamId: () => parsedParams().teamId,
  }
}
