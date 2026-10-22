import type { ConsentChoices } from "./consentChoices.js"

export type ConsentPreferences = ConsentChoices & {
  necessary: true
  updatedAt: string
}
