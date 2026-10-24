import { consentModeFromChoices } from "./consentModeFromChoices.js"
import type { ConsentChoices } from "./consentChoices.js"
import { gtagEnsure } from "./gtagEnsure.js"

/** Push a Consent Mode v2 update reflecting the latest choices. */
export function consentModeUpdate(choices: ConsentChoices): void {
  if (typeof window === "undefined") return

  gtagEnsure()
  window.gtag?.("consent", "update", consentModeFromChoices(choices))
}
