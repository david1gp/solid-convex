import { consentModeFromChoices } from "./consentModeFromChoices.js"
import { gtagEnsure } from "./gtagEnsure.js"

let consentModeInitialized = false

/** Register the Consent Mode v2 defaults (everything denied). Call once on app start. */
export function consentModeInit(): void {
  if (typeof window === "undefined" || consentModeInitialized) return

  gtagEnsure()
  window.gtag?.("consent", "default", consentModeFromChoices({ statistics: false, marketing: false }))
  consentModeInitialized = true
}
