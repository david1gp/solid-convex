import { appIcons } from "#src/app/icon/appIcons.ts"
import { urlOverview } from "#src/app/pages/urlOverview.ts"
import { urlOrgList } from "#src/org/org_url/urlOrg.ts"
import { urlUserManagement } from "#src/user_management/url/urlUserManagement.ts"

export interface AppShellNavigationItem {
  href: string
  icon: string
  label: string
}

export function appShellNavigation(): AppShellNavigationItem[] {
  return [
    { href: urlOverview(), icon: appIcons.overview, label: "Overview" },
    { href: urlOrgList(), icon: appIcons.organization, label: "Organizations" },
    { href: "/team", icon: appIcons.team, label: "Teams" },
    { href: "/project", icon: appIcons.project, label: "Projects" },
    { href: "/note", icon: appIcons.note, label: "Notes" },
    { href: urlUserManagement(), icon: appIcons.userManagement, label: "User Management" },
  ]
}
