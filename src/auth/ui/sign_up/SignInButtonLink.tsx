import { mdiArrowRight } from "@adaptive-ds/mdi/mdiArrowRight.js"
import { type ComponentProps, splitProps } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { urlPageSignIn } from "#src/auth/url/pageRouteAuth.ts"
import { urlSignInRedirectUrl } from "#src/auth/url/urlSignInRedirectUrl.ts"
import { createUrl } from "#src/utils/router/createUrl.ts"
import { searchParamGet } from "#src/utils/router/searchParamGet.ts"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"

export interface SignInButtonLinkProps extends Omit<ComponentProps<typeof LinkButtonInternal>, "to" | "href"> {
  text?: string
}

export function SignInButtonLink(p: SignInButtonLinkProps) {
  const [s, rest] = splitProps(p, ["text", "children", "iconRight", "variant"])

  function getUrl() {
    const url = createUrl()
    const email = searchParamGet("email", url) ?? ""
    const returnPath = searchParamGet("returnPath") || urlSignInRedirectUrl()
    return urlPageSignIn(email, returnPath)
  }
  return (
    <LinkButtonInternal
      to={getUrl()}
      iconRight={s.iconRight ?? mdiArrowRight}
      variant={s.variant ?? buttonVariant.contrast}
      {...rest}
    >
      {s.text ?? ttc("Sign In")}
    </LinkButtonInternal>
  )
}
