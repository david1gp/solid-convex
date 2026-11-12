import { useNavigate } from "@tanstack/solid-router"
import { createMemo } from "solid-js"
import { appIcons } from "#src/app/icon/appIcons.ts"
import type { Project } from "#src/project/model/projectSchema.ts"
import { projectPageDemoFixturesGet } from "#src/project/ui/demo/projectPageDemoFixturesGet.ts"
import { projectPageDemoHref } from "#src/project/ui/demo/projectPageDemoHref.ts"
import type { projectDetailPageStateCreate } from "#src/project/ui/projectDetailPageStateCreate.ts"
import { teamPageDemoHref } from "#src/team/ui/demo/teamPageDemoHref.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

type ProjectDetailPageState = ReturnType<typeof projectDetailPageStateCreate>

/** Local-only project detail state: fixture project and demo hrefs, no Convex or storage. */
export function projectDetailPageDemoStateCreate(
  orgHandle: () => string | undefined,
  teamId: () => string | undefined,
  projectId: () => string,
): ProjectDetailPageState {
  const navigate = useNavigate()
  const fixtures = projectPageDemoFixturesGet()
  const project = () => fixtures.get(projectId())
  const resolvedTeamId = () => teamId() ?? project()?.teamId
  const context = () => ({ orgHandle: orgHandle(), teamId: resolvedTeamId(), projectId: projectId() })
  const deleteDialogOpen = createSignalObject(false)
  const deleteTarget = createMemo(() => ({
    kind: "project" as const,
    projectId: projectId() as Project["projectId"],
  }))
  const selectedTab = createSignalObject("details")
  return {
    project,
    loading: () => false,
    error: () => "",
    listHref: () => projectPageDemoHref("list", { orgHandle: orgHandle(), teamId: teamId() }),
    editHref: () => projectPageDemoHref("edit", context()),
    teamHref: () => {
      const tid = resolvedTeamId()
      return tid ? teamPageDemoHref("detail", { orgHandle: orgHandle(), teamId: tid }) : undefined
    },
    orgHandle,
    teamId,
    projectId,
    teamName: () => resolvedTeamId(),
    orgName: () => orgHandle(),
    deleteDialogOpen,
    deleteTarget,
    onDeleteSuccess: () => {
      fixtures.remove(projectId())
      void navigate({ to: projectPageDemoHref("list", { orgHandle: orgHandle(), teamId: teamId() }) })
    },
    selectedTab,
    tabOptions: () => ["details", "notes"],
    tabText: (tab: string) => (tab === "details" ? "Details" : tab === "notes" ? "Notes" : tab),
    tabIcon: (tab: string) => (tab === "details" ? appIcons.details : tab === "notes" ? appIcons.note : ""),
  }
}
