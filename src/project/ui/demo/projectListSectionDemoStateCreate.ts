import { projectPageDemoFixturesGet } from "#src/project/ui/demo/projectPageDemoFixturesGet.ts"
import { projectPageDemoHref } from "#src/project/ui/demo/projectPageDemoHref.ts"
import type { projectListSectionStateCreate } from "#src/project/ui/projectListSectionStateCreate.ts"
import { teamPageDemoHref } from "#src/team/ui/demo/teamPageDemoHref.ts"

type ProjectListSectionState = ReturnType<typeof projectListSectionStateCreate>

function paginationStub(): ProjectListSectionState["pagination"] {
  return {
    page: () => undefined,
    result: () => undefined,
    canNext: () => false,
    canPrevious: () => false,
    next: () => {},
    previous: () => {},
    loading: () => false,
    cursor: () => null,
    history: () => [],
    reset: () => {},
  }
}

/** Local-only project list state: fixture projects and demo hrefs, no Convex or storage. */
export function projectListSectionDemoStateCreate(
  orgHandle: () => string | undefined,
  teamId: () => string | undefined,
): ProjectListSectionState {
  const fixtures = projectPageDemoFixturesGet()
  const context = () => ({ orgHandle: orgHandle(), teamId: teamId() })
  const projects = () => {
    const tid = teamId()
    return tid ? fixtures.projects().filter((project) => project.teamId === tid) : fixtures.projects()
  }
  return {
    pagination: paginationStub(),
    projects,
    error: () => "",
    createHref: () => projectPageDemoHref("create", context()),
    detailHref: (projectId: string) => projectPageDemoHref("detail", { ...context(), projectId }),
    editHref: (projectId: string) => projectPageDemoHref("edit", { ...context(), projectId }),
    teamListHref: () => teamPageDemoHref("list", { orgHandle: orgHandle() }),
    contextual: () => Boolean(teamId()),
  }
}
