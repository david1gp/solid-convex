import type { ConsentChoices } from "./consentChoices.js"
import type { ConsentModeState } from "./consentModeState.js"

/** Map the user's category choices onto Google Consent Mode v2 storage flags. */
export function consentModeFromChoices(choices: ConsentChoices): ConsentModeState {
  return {
    analytics_storage: choices.statistics ? "granted" : "denied",
    ad_storage: choices.marketing ? "granted" : "denied",
    ad_user_data: choices.marketing ? "granted" : "denied",
    ad_personalization: choices.marketing ? "granted" : "denied",
  }
}
