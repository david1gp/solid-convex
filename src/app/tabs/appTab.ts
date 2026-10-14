import { mdiAccountGroup } from "@adaptive-ds/mdi/mdiAccountGroup.js"
import { mdiFileDocument } from "@adaptive-ds/mdi/mdiFileDocument.js"

export type AppTab = keyof typeof appTab

export const appTab = {
  org: "org",
  resource: "resource",
} as const

export const appTabIcon = {
  [appTab.org]: mdiAccountGroup,
  [appTab.resource]: mdiFileDocument,
} as const
