import { type ConsentConfig, defaultConsentConfig } from "./consentConfig.js"
import { gtagEnsure } from "./gtagEnsure.js"
import { consentHasAnyTracking } from "./consentHasAnyTracking.js"

export function eventTrack(
  name: string,
  params: Record<string, unknown> = {},
  config: ConsentConfig = defaultConsentConfig,
): boolean {
  if (typeof window === "undefined" || !consentHasAnyTracking(config)) return false

  gtagEnsure()
  window.gtag?.("event", name, params)
  return true
}
