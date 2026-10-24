import { type ConsentConfig, defaultConsentConfig } from "./consentConfig.js"
import { eventTrack } from "./eventTrack.js"

export function pageViewTrack(path?: string, config: ConsentConfig = defaultConsentConfig): boolean {
  const page = path ?? (typeof window !== "undefined" ? window.location.pathname + window.location.search : undefined)
  return eventTrack(
    "page_view",
    {
      page_path: page,
      page_title: typeof document !== "undefined" ? document.title : undefined,
    },
    config,
  )
}
