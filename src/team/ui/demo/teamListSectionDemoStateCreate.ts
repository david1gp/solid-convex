import { teamPageDemoFixturesGet } from "#src/team/ui/demo/teamPageDemoFixturesGet.ts"
import { teamPageDemoHref } from "#src/team/ui/demo/teamPageDemoHref.ts"
import type { teamListSectionStateCreate } from "#src/team/ui/teamListSectionStateCreate.ts"

type TeamListSectionState = ReturnType<typeof teamListSectionStateCreate>

function paginationStub(): TeamListSectionState["pagination"] {
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

/** Local-only team list state: fixture teams and demo hrefs, no Convex or storage. */
export function teamListSectionDemoStateCreate(orgHandle: () => string | undefined): TeamListSectionState {
  const fixtures = teamPageDemoFixturesGet()
  return {
    pagination: paginationStub(),
    teams: fixtures.teams,
    error: () => "",
    createHref: () => teamPageDemoHref("create", { orgHandle: orgHandle() }),
    detailHref: (teamId: string) => teamPageDemoHref("detail", { orgHandle: orgHandle(), teamId }),
    editHref: (teamId: string) => teamPageDemoHref("edit", { orgHandle: orgHandle(), teamId }),
    contextual: () => !!orgHandle(),
  }
}
