import { mdiAccountGroup } from "@adaptive-ds/mdi/mdiAccountGroup.js"
import { mdiFileDocument } from "@adaptive-ds/mdi/mdiFileDocument.js"
import { mdiViewDashboardOutline } from "@adaptive-ds/mdi/mdiViewDashboardOutline.js"
import { urlOverview } from "#src/app/pages/urlOverview.ts"
import { urlOrgList } from "#src/org/org_url/urlOrg.ts"
import { urlResourceList } from "#src/resource/url/urlResource.ts"

export interface AppShellNavigationItem {
  href: string
  icon: string
  label: string
}

export function appShellNavigation(): AppShellNavigationItem[] {
  return [
    { href: urlOverview(), icon: mdiViewDashboardOutline, label: "Overview" },
    { href: urlOrgList(), icon: mdiAccountGroup, label: "Organizations" },
    { href: urlResourceList(), icon: mdiFileDocument, label: "Resources" },
  ]
}
