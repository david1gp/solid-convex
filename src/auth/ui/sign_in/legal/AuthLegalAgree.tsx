import { envBaseUrlSiteResult } from "#src/app/env/public/envBaseUrlSiteResult.ts"
import { ttc } from "#src/app/i18n/ttc.ts"
import { type AuthLegalAgreeVariant, authLegalAgreeText } from "#src/auth/ui/sign_in/legal/authLegalAgreeVariant.tsx"
import { LinkTextExternal } from "#ui/interactive/link/LinkText.jsx"
import { cn } from "cn"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface AuthLegalAgreeProps extends MayHaveClass {
  variant: AuthLegalAgreeVariant
}

export function AuthLegalAgree(p: AuthLegalAgreeProps) {
  const op = "AuthLegalAgree"
  const baseUrlSiteResult = envBaseUrlSiteResult()
  if (!baseUrlSiteResult.success) {
    console.error(op, baseUrlSiteResult.errorMessage)
    return null
  }
  const baseUrlSite = baseUrlSiteResult.data
  return (
    <div class={cn("text-muted-foreground", p.class)}>
      {authLegalAgreeText(p.variant)}
      <LinkTextExternal href={baseUrlSite + "/terms"} class="mx-1">
        {ttc("Terms of Service")}
      </LinkTextExternal>
      {ttc("and")}
      <LinkTextExternal href={baseUrlSite + "/privacy"} class="mx-1">
        {ttc("Privacy Policy")}
      </LinkTextExternal>
    </div>
  )
}
