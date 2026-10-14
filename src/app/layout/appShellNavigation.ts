import { mdiAccountGroup } from "@adaptive-ds/mdi/mdiAccountGroup.js"
import { mdiAccountMultipleOutline } from "@adaptive-ds/mdi/mdiAccountMultipleOutline.js"
import { mdiBriefcaseOutline } from "@adaptive-ds/mdi/mdiBriefcaseOutline.js"
import { mdiViewDashboardOutline } from "@adaptive-ds/mdi/mdiViewDashboardOutline.js"
import { urlOverview } from "#src/app/pages/urlOverview.ts"
import { urlOrgList } from "#src/org/org_url/urlOrg.ts"

export interface AppShellNavigationItem {
  href: string
  icon: string
  label: string
}

export function appShellNavigation(): AppShellNavigationItem[] {
  return [
    { href: urlOverview(), icon: mdiViewDashboardOutline, label: "Overview" },
    { href: urlOrgList(), icon: mdiAccountGroup, label: "Organizations" },
    { href: "/team", icon: mdiAccountMultipleOutline, label: "Teams" },
    { href: "/project", icon: mdiBriefcaseOutline, label: "Projects" },
  ]
}
