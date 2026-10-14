import { projectUrlBuild } from "#src/project/url/projectUrlBuild.ts"

export function projectHrefGet(
  view: "list" | "create" | "detail" | "edit",
  context: { orgHandle?: string; teamId?: string; projectId?: string } = {},
): string {
  const result = projectUrlBuild({ view, ...context })
  return result.success ? result.data : "/project"
}
