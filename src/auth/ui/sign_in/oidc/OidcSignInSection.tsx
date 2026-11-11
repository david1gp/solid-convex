import { mdiLockOutline } from "@adaptive-ds/mdi/mdiLockOutline.js"
import { enableOidc } from "#src/app/config/enableOidc.ts"
import { oidcSignInLabel } from "#src/app/config/oidcSignInLabel.ts"
import { ttc } from "#src/app/i18n/ttc.ts"
import { AuthSectionCard } from "#src/auth/ui/shared/AuthSectionCard.tsx"
import { urlSignInViaOidc } from "#src/auth/url/urlSignInViaOidc.ts"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonExternal } from "#ui/interactive/link/LinkButton.jsx"

export function OidcSignInSection() {
  if (!enableOidc()) return null

  const label = oidcSignInLabel()
  return (
    <AuthSectionCard
      icon={mdiLockOutline}
      title={ttc("Single Sign-On")}
      subtitle={ttc("Use your organization account")}
    >
      <LinkButtonExternal
        href={urlSignInViaOidc()}
        variant={buttonVariant.filledIndigo}
        class="w-full"
        aria-label={label}
      >
        {label}
      </LinkButtonExternal>
    </AuthSectionCard>
  )
}
