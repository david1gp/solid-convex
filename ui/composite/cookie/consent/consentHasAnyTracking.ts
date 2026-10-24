import { type ConsentConfig, defaultConsentConfig } from "./consentConfig.js"
import { consentGetStored } from "./consentGetStored.js"

export function consentHasAnyTracking(config: ConsentConfig = defaultConsentConfig): boolean {
  const stored = consentGetStored(config)
  return stored?.statistics === true || stored?.marketing === true
}
