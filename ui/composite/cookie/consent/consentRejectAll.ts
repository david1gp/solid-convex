import { type ConsentConfig, defaultConsentConfig } from "./consentConfig.js"
import type { ConsentPreferences } from "./consentPreferences.js"
import { consentSave } from "./consentSave.js"

export function consentRejectAll(config: ConsentConfig = defaultConsentConfig): ConsentPreferences {
  return consentSave({ statistics: false, marketing: false }, config)
}
