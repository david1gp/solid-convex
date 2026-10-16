import { appIcons } from "#src/app/icon/appIcons.ts"

export type AppTab = keyof typeof appTab

export const appTab = {
  org: "org",
  team: "team",
  project: "project",
  resource: "resource",
} as const

export const appTabIcon = {
  [appTab.org]: appIcons.organization,
  [appTab.team]: appIcons.team,
  [appTab.project]: appIcons.project,
  [appTab.resource]: appIcons.resource,
} as const
