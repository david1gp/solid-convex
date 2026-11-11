import { mdiLockOutline } from "@adaptive-ds/mdi/mdiLockOutline.js"
import { authworksSignInLabel } from "#src/app/config/authworksSignInLabel.ts"
import { enableAuthworks } from "#src/app/config/enableAuthworks.ts"
import { ttc } from "#src/app/i18n/ttc.ts"
import { AuthSectionCard } from "#src/auth/ui/shared/AuthSectionCard.tsx"
import { urlSignInViaAuthworks } from "#src/auth/url/urlSignInViaAuthworks.ts"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonExternal } from "#ui/interactive/link/LinkButton.jsx"

export function AuthworksSignInSection() {
  if (!enableAuthworks()) return null

  const label = authworksSignInLabel()
  return (
    <AuthSectionCard
      icon={mdiLockOutline}
      title={ttc("Single Sign-On")}
      subtitle={ttc("Use your organization account")}
    >
      <LinkButtonExternal
        href={urlSignInViaAuthworks()}
        variant={buttonVariant.filledIndigo}
        class="w-full"
        aria-label={label}
      >
        {label}
      </LinkButtonExternal>
    </AuthSectionCard>
  )
}
