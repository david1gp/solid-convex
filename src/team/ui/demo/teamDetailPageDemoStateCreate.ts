import { useNavigate } from "@tanstack/solid-router"
import { createMemo } from "solid-js"
import { appIcons } from "#src/app/icon/appIcons.ts"
import type { Team } from "#src/team/model/teamSchema.ts"
import { teamPageDemoFixturesGet } from "#src/team/ui/demo/teamPageDemoFixturesGet.ts"
import { teamPageDemoHref } from "#src/team/ui/demo/teamPageDemoHref.ts"
import type { teamDetailPageStateCreate } from "#src/team/ui/teamDetailPageStateCreate.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

type TeamDetailPageState = ReturnType<typeof teamDetailPageStateCreate>

/** Local-only team detail state: fixture team and demo hrefs, no Convex or storage. */
export function teamDetailPageDemoStateCreate(
  orgHandle: () => string | undefined,
  teamId: () => string,
): TeamDetailPageState {
  const navigate = useNavigate()
  const fixtures = teamPageDemoFixturesGet()
  const team = () => fixtures.get(teamId())
  const deleteDialogOpen = createSignalObject(false)
  const deleteTarget = createMemo(() => ({
    kind: "team" as const,
    teamId: teamId() as Team["teamId"],
  }))
  const selectedTab = createSignalObject("details")
  return {
    team,
    loading: () => false,
    error: () => "",
    listHref: () => teamPageDemoHref("list", { orgHandle: orgHandle() }),
    editHref: () => teamPageDemoHref("edit", { orgHandle: orgHandle(), teamId: teamId() }),
    orgHandle,
    orgName: () => orgHandle(),
    deleteDialogOpen,
    deleteTarget,
    onDeleteSuccess: () => {
      fixtures.remove(teamId())
      void navigate({ to: teamPageDemoHref("list", { orgHandle: orgHandle() }) })
    },
    selectedTab,
    tabOptions: () => ["details", "projects"],
    tabText: (tab: string) => (tab === "details" ? "Details" : tab === "projects" ? "Projects" : tab),
    tabIcon: (tab: string) => (tab === "details" ? appIcons.details : tab === "projects" ? appIcons.project : ""),
  }
}
