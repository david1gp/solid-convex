import { noteUrlBuild } from "#src/note/url/noteUrlBuild.ts"

export function noteHrefGet(
  view: "list" | "create" | "detail" | "edit",
  context: { orgHandle?: string; teamId?: string; projectId?: string; noteId?: string } = {},
): string {
  const result = noteUrlBuild({ view, ...context })
  return result.success ? result.data : "/note"
}
