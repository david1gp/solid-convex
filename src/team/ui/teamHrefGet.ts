import { teamUrlBuild } from "#src/team/url/teamUrlBuild.ts"

export function teamHrefGet(view: "list" | "create" | "detail" | "edit", orgHandle?: string, teamId?: string) {
  const result = teamUrlBuild({ view, orgHandle, teamId })
  return result.success ? result.data : "/org"
}
