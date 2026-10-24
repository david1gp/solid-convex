import { preferencesBuild } from "./preferencesBuild.js"
import { googleCookiesClear } from "./googleCookiesClear.js"
import { type ConsentConfig, defaultConsentConfig } from "./consentConfig.js"
import type { ConsentChoices } from "./consentChoices.js"
import type { ConsentPreferences } from "./consentPreferences.js"
import { consentModeInit } from "./consentModeInit.js"
import { consentModeUpdate } from "./consentModeUpdate.js"

/** Persist the user's choices, dispatch the change event, and sync Google Consent Mode. */
export function consentSave(choices: ConsentChoices, config: ConsentConfig = defaultConsentConfig): ConsentPreferences {
  consentModeInit()

  const preferences = preferencesBuild(choices)

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(config.storageKey, JSON.stringify(preferences))
    } catch {
      // storage unavailable (private mode / quota) — consent simply won't persist
    }
    window.dispatchEvent(new CustomEvent(config.changeEvent, { detail: preferences }))
  }

  consentModeUpdate(choices)

  if (!choices.statistics && !choices.marketing) googleCookiesClear()

  return preferences
}
