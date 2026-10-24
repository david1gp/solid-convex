import { type ConsentConfig, defaultConsentConfig } from "./consentConfig.js"
import type { ConsentPreferences } from "./consentPreferences.js"
import { consentSave } from "./consentSave.js"

export function consentAcceptAll(config: ConsentConfig = defaultConsentConfig): ConsentPreferences {
  return consentSave({ statistics: true, marketing: true }, config)
}
