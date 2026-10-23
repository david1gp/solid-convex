import { mdiCookie } from "@adaptive-ds/mdi/mdiCookie.js"
import { mdiShieldCheckOutline } from "@adaptive-ds/mdi/mdiShieldCheckOutline.js"
import Dialog from "@corvu/dialog"
import { For, Show } from "solid-js"
import { Button } from "#ui/interactive/button/Button.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.js"
import { classesDialogOverlayMerge } from "#ui/interactive/dialog/classesDialogContent.js"
import { Icon } from "#ui/static/icon/Icon.jsx"
import { ConsentCategoryCard } from "./ConsentCategoryCard.jsx"
import { ConsentFooterLinks } from "./ConsentFooterLinks.jsx"
import type { ConsentConfig } from "./consent/consentConfig.js"
import type { ConsentPreferences } from "./consent/consentPreferences.js"
import type { CookieBannerLabels } from "./cookieBannerLabels.js"
import { cookieBannerStateCreate } from "./cookieBannerStateCreate.js"

export interface CookieBannerProps {
  /** GA4 measurement id, e.g. `G-XXXXXXXXXX`. */
  gaId?: string
  /** Google Ads id, e.g. `AW-XXXXXXXXXX`. */
  adsId?: string
  /** Link to the privacy policy. Defaults to `/datenschutz`. */
  privacyHref?: string
  /** Link to the imprint. Hidden when omitted. */
  imprintHref?: string
  /** Override any of the banner texts / categories. Merged over the German defaults. */
  labels?: Partial<CookieBannerLabels>
  /** Override the `localStorage` key + event names. */
  consentConfig?: Partial<ConsentConfig>
  /** Controlled visibility. When provided, the banner reflects this instead of its internal signal. */
  open?: boolean
  /** Notified whenever the banner wants to open/close. */
  onOpenChange?: (open: boolean) => void
  /** Controlled settings view. When provided, overrides the internal signal. */
  showSettings?: boolean
  /** Notified whenever the settings view is toggled. */
  onShowSettingsChange?: (showSettings: boolean) => void
  /** Called whenever consent is persisted (accept / reject / save). */
  onConsentChange?: (preferences: ConsentPreferences) => void
}

/** Cookie consent banner gating Google tracking. */
export function CookieBanner(p: CookieBannerProps) {
  const state = cookieBannerStateCreate({
    labels: () => p.labels,
    consentConfig: () => p.consentConfig,
    gaId: () => p.gaId,
    adsId: () => p.adsId,
    open: () => p.open,
    onOpenChange: p.onOpenChange,
    showSettings: () => p.showSettings,
    onShowSettingsChange: p.onShowSettingsChange,
    onConsentChange: p.onConsentChange,
  })

  return (
    // Consent gate: non-dismissable (no Esc / outside-click / close button) so a choice must be made.
    // The corvu Dialog primitive gives focus-trap, scroll-lock and aria wiring for free.
    <Dialog
      open={state.isVisible()}
      onOpenChange={state.setVisible}
      role="alertdialog"
      closeOnEscapeKeyDown={false}
      closeOnOutsidePointer={false}
      closeOnOutsideFocus={false}
    >
      <Dialog.Portal>
        <Dialog.Overlay class={classesDialogOverlayMerge("z-80 bg-black/30 backdrop-blur-xs")} />
        <Dialog.Content class="fixed inset-0 z-80 flex items-end justify-center p-3 focus:outline-none sm:p-6">
          <div class="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            <div class="max-h-[calc(100svh-1.5rem)] overflow-y-auto">
              <div class="p-5 sm:p-6">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <Dialog.Label class="text-xl font-semibold tracking-tight sm:text-2xl">
                      <Show when={state.showSettings()} fallback={state.labels().defaultTitle}>
                        {state.labels().settingsTitle}
                      </Show>
                    </Dialog.Label>
                    <Dialog.Description class="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-400">
                      <Show when={state.showSettings()} fallback={state.labels().defaultDescription}>
                        {state.labels().settingsDescription}
                      </Show>
                    </Dialog.Description>
                  </div>
                  <span class="mt-0.5 flex shrink-0 items-center justify-center text-green-700 dark:text-green-300">
                    <Icon path={state.showSettings() ? mdiCookie : mdiShieldCheckOutline} class="size-10 dark:fill-current" />
                  </span>
                </div>

                <Show when={state.showSettings()}>
                  <div class="mt-5 space-y-3">
                    <ConsentCategoryCard
                      title={state.labels().necessary.title}
                      description={state.labels().necessary.description}
                      tools={state.labels().necessary.tools}
                      servicesLabel={state.labels().servicesLabel}
                      enabledSuffix={state.labels().enabledSuffix}
                      disabledSuffix={state.labels().disabledSuffix}
                      checked
                      disabled
                    />
                    <For each={state.labels().optionalCategories}>
                      {(category) => (
                        <ConsentCategoryCard
                          title={category.title}
                          description={category.description}
                          tools={category.tools}
                          servicesLabel={state.labels().servicesLabel}
                          enabledSuffix={state.labels().enabledSuffix}
                          disabledSuffix={state.labels().disabledSuffix}
                          checked={state.choices.get()[category.id]}
                          onToggle={() => state.toggle(category.id)}
                        />
                      )}
                    </For>
                  </div>
                </Show>
              </div>

              <div class="sticky bottom-0 border-t border-slate-200 bg-white/95 p-4 backdrop-blur sm:p-5 dark:border-slate-700 dark:bg-slate-900/95">
                <div class="grid gap-2 sm:grid-cols-3">
                  <Button
                    variant={buttonVariant.outline}
                    class="order-3 rounded-full sm:order-1"
                    onClick={state.handleRejectAll}
                  >
                    {state.labels().rejectAll}
                  </Button>
                  <Show
                    when={state.showSettings()}
                    fallback={
                      <Button
                        variant={buttonVariant.outline}
                        class="order-2 rounded-full"
                        onClick={() => state.setShowSettings(true)}
                      >
                        {state.labels().customize}
                      </Button>
                    }
                  >
                    <Button
                      variant={buttonVariant.filledGreen}
                      class="order-1 rounded-full sm:order-2"
                      onClick={state.handleSaveSelection}
                    >
                      {state.labels().saveSelection}
                    </Button>
                  </Show>
                  <Button
                    variant={state.showSettings() ? buttonVariant.outline : buttonVariant.filledGreen}
                    class="order-1 rounded-full sm:order-3"
                    onClick={state.handleAcceptAll}
                  >
                    {state.labels().acceptAll}
                  </Button>
                </div>
                <ConsentFooterLinks
                  privacyHref={p.privacyHref ?? "/datenschutz"}
                  privacyLabel={state.labels().privacyLabel}
                  imprintHref={p.imprintHref}
                  imprintLabel={state.labels().imprintLabel}
                  note={state.labels().footerNote}
                />
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
