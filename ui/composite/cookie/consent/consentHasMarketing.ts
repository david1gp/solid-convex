import { type ConsentConfig, defaultConsentConfig } from "./consentConfig.js"
import { consentGetStored } from "./consentGetStored.js"

export function consentHasMarketing(config: ConsentConfig = defaultConsentConfig): boolean {
  return consentGetStored(config)?.marketing === true
}
