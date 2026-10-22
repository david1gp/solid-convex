import { mdiLockOutline } from "@adaptive-ds/mdi/mdiLockOutline.js"
import { Show } from "solid-js"
import { authworksSignInLabel } from "#src/app/config/authworksSignInLabel.ts"
import { enableAuthworks } from "#src/app/config/enableAuthworks.ts"
import { enableOidc } from "#src/app/config/enableOidc.ts"
import { oidcSignInLabel } from "#src/app/config/oidcSignInLabel.ts"
import { ttc } from "#src/app/i18n/ttc.ts"
import { AuthSectionCard } from "#src/auth/ui/shared/AuthSectionCard.tsx"
import { urlSignInViaAuthworksOidc } from "#src/auth/url/urlSignInViaAuthworksOidc.ts"
import { urlSignInViaOidc } from "#src/auth/url/urlSignInViaOidc.ts"
import { buttonSize, buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonExternal } from "#ui/interactive/link/LinkButton.jsx"

export function OidcSignInSection() {
  if (!enableOidc() && !enableAuthworks()) return null

  const label = oidcSignInLabel()
  const authworksLabel = authworksSignInLabel()
  return (
    <AuthSectionCard
      icon={mdiLockOutline}
      title={ttc("Single Sign-On")}
      subtitle={ttc("Use your organization account")}
    >
      <Show when={enableOidc()}>
        <LinkButtonExternal
          href={urlSignInViaOidc()}
          size={buttonSize.default}
          variant={buttonVariant.filledIndigo}
          class="w-full"
          aria-label={label}
        >
          {label}
        </LinkButtonExternal>
      </Show>
      <Show when={enableAuthworks()}>
        <LinkButtonExternal
          href={urlSignInViaAuthworksOidc()}
          size={buttonSize.default}
          variant={buttonVariant.filledIndigo}
          class="w-full"
          aria-label={authworksLabel}
        >
          {authworksLabel}
        </LinkButtonExternal>
      </Show>
    </AuthSectionCard>
  )
}
