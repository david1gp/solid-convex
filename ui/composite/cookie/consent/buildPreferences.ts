import type { ConsentChoices } from "./consentChoices.js"
import type { ConsentPreferences } from "./consentPreferences.js"

/** Build a fully-formed, timestamped preferences record from raw choices. */
export function buildPreferences(choices: ConsentChoices): ConsentPreferences {
  return {
    necessary: true,
    statistics: choices.statistics,
    marketing: choices.marketing,
    updatedAt: new Date().toISOString(),
  }
}
