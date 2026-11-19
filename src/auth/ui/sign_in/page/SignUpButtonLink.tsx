import { mdiArrowRight } from "@adaptive-ds/mdi/mdiArrowRight.js"
import { omit } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { urlPageSignUp } from "#src/auth/url/pageRouteAuth.ts"
import { urlSignInRedirectUrl } from "#src/auth/url/urlSignInRedirectUrl.ts"
import { createUrl } from "#src/utils/router/createUrl.ts"
import { searchParamGet } from "#src/utils/router/searchParamGet.ts"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { type ComponentProps } from "@solidjs/web"

export interface SignUpButtonLinkProps extends Omit<ComponentProps<typeof LinkButtonInternal>, "to" | "href"> {
  text?: string
}

export function SignUpButtonLink(p: SignUpButtonLinkProps) {
  const rest = omit(p, "text", "children", "iconRight", "variant")
  function getUrl() {
    const url = createUrl()
    const email = searchParamGet("email", url) ?? ""
    const returnPath = searchParamGet("returnPath") || urlSignInRedirectUrl()
    return urlPageSignUp(email, returnPath)
  }
  return (
    <LinkButtonInternal
      to={getUrl()}
      iconRight={p.iconRight ?? mdiArrowRight}
      variant={p.variant ?? buttonVariant.contrast}
      {...rest}
    >
      {p.text ?? ttc("Sign Up")}
    </LinkButtonInternal>
  )
}
