import { type ConsentConfig, defaultConsentConfig } from "./consentConfig.js"
import { consentGetStored } from "./consentGetStored.js"

export function consentHasStatistics(config: ConsentConfig = defaultConsentConfig): boolean {
  return consentGetStored(config)?.statistics === true
}
