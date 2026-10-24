import { type PostHog, type PostHogConfig, posthog } from "posthog-js"
import { enablePosthog } from "#src/app/config/enablePosthog.ts"
import { envEnvModeResult } from "#src/app/env/public/envEnvModeResult.ts"
import { envPosthogAppIdResult } from "#src/app/env/public/envPosthogAppIdResult.ts"
import type { UserSession } from "#src/auth/model/UserSession.ts"

/**
 * https://posthog.com/docs/product-analytics/identify
 * {@link import("#src/ops/monitoring_ui/PosthogMonitoringWrapper.tsx.ts")}
 * {@link import("#src/ops/monitoring_ui/identifyUserInBrowserForMonitoring.tsx.ts")}
 * {@link import("#src/astro/layouts/head/posthog.ts.ts")}
 */
export function posthogInit(session?: UserSession) {
  if (!enablePosthog()) {
    return
  }

  const modeResult = envEnvModeResult()
  if (!modeResult.success) {
    console.error(modeResult)
    return
  }

  const idResult = envPosthogAppIdResult()
  if (!idResult.success) {
    console.error(idResult)
    return
  }

  function loaded(posthog: PostHog) {
    if (!session) return
    const user = session.profile
    const distinctId = user.email
    if (!distinctId) return
    posthog.identify(distinctId, user)
  }

  // https://posthog.com/docs/libraries/js
  const config: Partial<PostHogConfig> = {
    persistence: "localStorage",
    api_host: "/ph-api",
    ui_host: "/ph-ui",
    advanced_disable_feature_flags_on_first_load: true,
    advanced_disable_feature_flags: true,
    enable_recording_console_log: true,
    disable_session_recording: false,
    session_recording: {
      maskAllInputs: false,
      maskInputOptions: {
        password: true,
      },
    },
    person_profiles: "identified_only", // or 'always' to create profiles for anonymous users as well
    defaults: "2025-11-30",
  }

  // const name = "app" + "/" + modeResult.data
  const name = "app"

  posthog.init(idResult.data, config, name)
}
