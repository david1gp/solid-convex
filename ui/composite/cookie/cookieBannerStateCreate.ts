import { onCleanup, onMount } from "solid-js"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"
import { acceptAllConsent } from "./consent/acceptAllConsent.js"
import type { ConsentCategory } from "./consent/consentCategory.js"
import type { ConsentChoices } from "./consent/consentChoices.js"
import { type ConsentConfig, resolveConsentConfig } from "./consent/consentConfig.js"
import type { ConsentPreferences } from "./consent/consentPreferences.js"
import { enableGoogleTracking } from "./consent/enableGoogleTracking.js"
import { getStoredConsent } from "./consent/getStoredConsent.js"
import type { GoogleTrackingConfig } from "./consent/googleTrackingConfig.js"
import { initConsentMode } from "./consent/initConsentMode.js"
import { rejectAllConsent } from "./consent/rejectAllConsent.js"
import { saveConsent } from "./consent/saveConsent.js"
import { type CookieBannerLabels, defaultCookieBannerLabels } from "./cookieBannerLabels.js"

export function cookieBannerStateCreate(p: {
  labels?: () => Partial<CookieBannerLabels> | undefined
  consentConfig?: () => Partial<ConsentConfig> | undefined
  gaId?: () => string | undefined
  adsId?: () => string | undefined
  open?: () => boolean | undefined
  onOpenChange?: (open: boolean) => void
  showSettings?: () => boolean | undefined
  onShowSettingsChange?: (showSettings: boolean) => void
  onConsentChange?: (preferences: ConsentPreferences) => void
}) {
  const internalVisible = createSignalObject(false)
  const internalShowSettings = createSignalObject(false)
  const choices = createSignalObject<ConsentChoices>({
    statistics: false,
    marketing: false,
  })

  const labels = (): CookieBannerLabels => ({
    ...defaultCookieBannerLabels,
    ...p.labels?.(),
  })
  const config = (): ConsentConfig => resolveConsentConfig(p.consentConfig?.())
  const trackingConfig = (): GoogleTrackingConfig => ({
    gaId: p.gaId?.(),
    adsId: p.adsId?.(),
  })

  const isVisible = () => (p.open?.() !== undefined ? p.open()! : internalVisible.get())
  const setVisible = (v: boolean) => {
    if (p.open?.() === undefined) internalVisible.set(v)
    p.onOpenChange?.(v)
  }

  const showSettings = () => (p.showSettings?.() !== undefined ? p.showSettings()! : internalShowSettings.get())
  const setShowSettings = (v: boolean) => {
    if (p.showSettings?.() === undefined) internalShowSettings.set(v)
    p.onShowSettingsChange?.(v)
  }

  onMount(() => {
    initConsentMode()

    const stored = getStoredConsent(config())
    if (stored) {
      choices.set({
        statistics: stored.statistics,
        marketing: stored.marketing,
      })
      // Returning visitor with prior consent — re-arm Google tracking on this page load.
      enableGoogleTracking(trackingConfig(), config())
    } else {
      setVisible(true)
    }

    const openPreferences = () => {
      const current = getStoredConsent(config())
      if (current)
        choices.set({
          statistics: current.statistics,
          marketing: current.marketing,
        })
      setShowSettings(true)
      setVisible(true)
    }

    const event = config().preferencesEvent
    window.addEventListener(event, openPreferences)
    onCleanup(() => window.removeEventListener(event, openPreferences))
  })

  const close = () => {
    setVisible(false)
    setShowSettings(false)
  }

  const applyAndClose = (choice: ConsentChoices) => {
    const preferences = saveConsent(choice, config())
    enableGoogleTracking(trackingConfig(), config())
    p.onConsentChange?.(preferences)
    close()
  }

  const handleAcceptAll = () => {
    const preferences = acceptAllConsent(config())
    enableGoogleTracking(trackingConfig(), config())
    p.onConsentChange?.(preferences)
    close()
  }

  const handleRejectAll = () => {
    const preferences = rejectAllConsent(config())
    p.onConsentChange?.(preferences)
    close()
  }

  const handleSaveSelection = () => applyAndClose(choices.get())

  const toggle = (id: ConsentCategory) => choices.set({ ...choices.get(), [id]: !choices.get()[id] })

  return {
    choices,
    labels,
    config,
    isVisible,
    setVisible,
    setShowSettings,
    showSettings,
    close,
    handleAcceptAll,
    handleRejectAll,
    handleSaveSelection,
    toggle,
  }
}
