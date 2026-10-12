import { mdiAccountGroup } from "@adaptive-ds/mdi/mdiAccountGroup.js"
import { mdiBriefcase } from "@adaptive-ds/mdi/mdiBriefcase.js"
import { mdiFileDocument } from "@adaptive-ds/mdi/mdiFileDocument.js"
import { mdiViewDashboardOutline } from "@adaptive-ds/mdi/mdiViewDashboardOutline.js"
import { urlOverview } from "#src/app/pages/urlOverview.ts"
import { urlOrgList } from "#src/org/org_url/urlOrg.ts"
import { urlResourceList } from "#src/resource/url/urlResource.ts"
import { urlWorkspaceList } from "#src/workspace/workspace_url/urlWorkspace.ts"

export interface AppShellNavigationItem {
  href: string
  icon: string
  label: string
}

export function appShellNavigation(): AppShellNavigationItem[] {
  return [
    { href: urlOverview(), icon: mdiViewDashboardOutline, label: "Overview" },
    { href: urlOrgList(), icon: mdiAccountGroup, label: "Organizations" },
    { href: urlWorkspaceList(), icon: mdiBriefcase, label: "Workspaces" },
    { href: urlResourceList(), icon: mdiFileDocument, label: "Resources" },
  ]
}
