import { cn } from "cn"
import { type ConsentConfig, consentConfigResolve } from "./consent/consentConfig.js"
import { cookiePreferencesOpen } from "./consent/cookiePreferencesOpen.js"
import { defaultCookieBannerLabels } from "./cookieBannerLabels.js"

export interface CookieSettingsButtonProps {
  class?: string
  /** Button text. Defaults to the German "Cookie-Einstellungen". */
  children?: string
  /** Override storage key / event names so it targets the matching banner. */
  consentConfig?: Partial<ConsentConfig>
}

/** Small text button to re-open the cookie settings (e.g. in a footer). */
export function CookieSettingsButton(p: CookieSettingsButtonProps) {
  return (
    <button
      type="button"
      onClick={() => cookiePreferencesOpen(consentConfigResolve(p.consentConfig))}
      class={cn(
        "cursor-pointer text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
        p.class,
      )}
    >
      {p.children ?? defaultCookieBannerLabels.settingsButton}
    </button>
  )
}
