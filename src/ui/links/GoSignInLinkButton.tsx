import { mdiHome } from "@adaptive-ds/mdi/mdiHome.js"
import { omit } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { urlPageSignIn } from "#src/auth/url/pageRouteAuth.ts"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { type ComponentProps } from "@solidjs/web"

export function GoSignInLinkButton(p: Omit<ComponentProps<typeof LinkButtonInternal>, "to" | "href">) {
  const rest = omit(p, "icon", "children", "variant")
  return (
    <LinkButtonInternal
      icon={p.icon ?? mdiHome}
      to={urlPageSignIn()}
      variant={p.variant ?? buttonVariant.outline}
      {...rest}
    >
      {ttc("Go to Sign-In")}
    </LinkButtonInternal>
  )
}
