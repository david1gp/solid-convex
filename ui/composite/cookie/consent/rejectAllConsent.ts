import { type ConsentConfig, defaultConsentConfig } from "./consentConfig.js"
import type { ConsentPreferences } from "./consentPreferences.js"
import { saveConsent } from "./saveConsent.js"

export function rejectAllConsent(config: ConsentConfig = defaultConsentConfig): ConsentPreferences {
  return saveConsent({ statistics: false, marketing: false }, config)
}
