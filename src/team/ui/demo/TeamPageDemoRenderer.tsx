import type { Team } from "#src/team/model/teamSchema.ts"
import { projectListSectionDemoStateCreate } from "#src/project/ui/demo/projectListSectionDemoStateCreate.ts"
import { teamDetailPageDemoStateCreate } from "#src/team/ui/demo/teamDetailPageDemoStateCreate.ts"
import { teamFormDemoStateCreate } from "#src/team/ui/demo/teamFormDemoStateCreate.ts"
import { teamListSectionDemoStateCreate } from "#src/team/ui/demo/teamListSectionDemoStateCreate.ts"
import { teamPageDemoFixturesGet } from "#src/team/ui/demo/teamPageDemoFixturesGet.ts"
import { teamPageDemoHref } from "#src/team/ui/demo/teamPageDemoHref.ts"
import { teamPageDemoRendererStateCreate } from "#src/team/ui/demo/teamPageDemoRendererStateCreate.ts"
import { TeamCreatePage } from "#src/team/ui/TeamCreatePage.tsx"
import { TeamDetailPage } from "#src/team/ui/TeamDetailPage.tsx"
import { TeamEditPage } from "#src/team/ui/TeamEditPage.tsx"
import { TeamListPage } from "#src/team/ui/TeamListPage.tsx"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.tsx"

function TeamListDemo() {
  const route = teamPageDemoRendererStateCreate()
  return (
    <>
      <nav class="flex flex-wrap gap-3 my-4">
        <LinkButtonInternal to={teamPageDemoHref("list", { orgHandle: route.orgHandle() })}>
          Teams demo list
        </LinkButtonInternal>
      </nav>
      <TeamListPage demo={{ section: teamListSectionDemoStateCreate(route.orgHandle) }} />
    </>
  )
}

function TeamDetailDemo() {
  const route = teamPageDemoRendererStateCreate()
  return (
    <>
      <nav class="flex flex-wrap gap-3 my-4">
        <LinkButtonInternal to={teamPageDemoHref("list", { orgHandle: route.orgHandle() })}>
          Teams demo list
        </LinkButtonInternal>
      </nav>
      <TeamDetailPage
        demo={{
          detail: teamDetailPageDemoStateCreate(route.orgHandle, route.teamId),
          projects: projectListSectionDemoStateCreate(route.orgHandle, route.teamId),
        }}
      />
    </>
  )
}

function TeamCreateDemo() {
  const route = teamPageDemoRendererStateCreate()
  const team = () => undefined as Team | undefined
  return (
    <>
      <nav class="flex flex-wrap gap-3 my-4">
        <LinkButtonInternal to={teamPageDemoHref("list", { orgHandle: route.orgHandle() })}>
          Teams demo list
        </LinkButtonInternal>
      </nav>
      <TeamCreatePage demo={{ form: teamFormDemoStateCreate(route.orgHandle, team) }} />
    </>
  )
}

function TeamEditDemo() {
  const route = teamPageDemoRendererStateCreate()
  const fixtures = teamPageDemoFixturesGet()
  const team = () => fixtures.get(route.teamId())
  return (
    <>
      <nav class="flex flex-wrap gap-3 my-4">
        <LinkButtonInternal to={teamPageDemoHref("list", { orgHandle: route.orgHandle() })}>
          Teams demo list
        </LinkButtonInternal>
      </nav>
      <TeamEditPage
        demo={{ orgHandle: route.orgHandle(), team, form: teamFormDemoStateCreate(route.orgHandle, team) }}
      />
    </>
  )
}

/** Opt-in map: caller mounts only these isolated entries inside the demo boundary. */
export const teamPageDemoRendererMap = {
  "/team": TeamListDemo,
  "/team/:teamId": TeamDetailDemo,
  "/team/:teamId/edit": TeamEditDemo,
  "/org/:orgHandle/team": TeamListDemo,
  "/org/:orgHandle/team/create": TeamCreateDemo,
  "/org/:orgHandle/team/:teamId": TeamDetailDemo,
  "/org/:orgHandle/team/:teamId/edit": TeamEditDemo,
} as const
