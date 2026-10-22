import type { ConsentModeValue } from "./consentModeValue.js"

export type ConsentModeState = {
  ad_storage: ConsentModeValue
  analytics_storage: ConsentModeValue
  ad_user_data: ConsentModeValue
  ad_personalization: ConsentModeValue
}
