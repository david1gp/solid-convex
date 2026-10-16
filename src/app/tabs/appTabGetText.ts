import { ttc } from "#src/app/i18n/ttc.ts"
import { type AppTab, appTab } from "#src/app/tabs/appTab.ts"

export function appTabGetText(tab: string): string {
  switch (tab as AppTab) {
    case appTab.org:
      return ttc("Organization")
    case appTab.team:
      return ttc("Teams")
    case appTab.project:
      return ttc("Projects")
    case appTab.resource:
      return ttc("Resources")
  }
}
