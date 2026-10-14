import { mdiAccountCogOutline } from "@adaptive-ds/mdi/mdiAccountCogOutline.js"
import { mdiAccountGroup } from "@adaptive-ds/mdi/mdiAccountGroup.js"
import { mdiAccountMultipleOutline } from "@adaptive-ds/mdi/mdiAccountMultipleOutline.js"
import { mdiBriefcaseOutline } from "@adaptive-ds/mdi/mdiBriefcaseOutline.js"
import { mdiFileDocument } from "@adaptive-ds/mdi/mdiFileDocument.js"
import { mdiNoteTextOutline } from "@adaptive-ds/mdi/mdiNoteTextOutline.js"
import { urlOrgList } from "#src/org/org_url/urlOrg.ts"
import { urlResourceList } from "#src/resource/url/urlResource.ts"
import { urlUserManagement } from "#src/user_management/url/urlUserManagement.ts"
import { ttt } from "#ui/i18n/ttt.ts"

export function overviewPageStateCreate() {
  return {
    cards: () => [
      {
        href: urlOrgList(),
        icon: mdiAccountGroup,
        title: ttt("Organizations"),
        description: ttt("Manage organizations and their members."),
      },
      {
        href: "/team",
        icon: mdiAccountMultipleOutline,
        title: ttt("Teams"),
        description: ttt("Collaborate across teams within organizations."),
      },
      {
        href: "/project",
        icon: mdiBriefcaseOutline,
        title: ttt("Projects"),
        description: ttt("Organize work and initiatives in projects."),
      },
      {
        href: "/note",
        icon: mdiNoteTextOutline,
        title: ttt("Notes"),
        description: ttt("Create and edit project markdown notes."),
      },
      {
        href: urlUserManagement(),
        icon: mdiAccountCogOutline,
        title: ttt("User Management"),
        description: ttt("Manage user roles and team assignments."),
      },
      {
        href: urlResourceList(),
        icon: mdiFileDocument,
        title: ttt("Resources"),
        description: ttt("Manage uploaded files and resources."),
      },
    ],
  }
}
