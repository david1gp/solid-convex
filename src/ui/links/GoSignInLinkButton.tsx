import { mdiHome } from "@adaptive-ds/mdi/mdiHome.js"
import { splitProps } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { urlPageSignIn } from "#src/auth/url/pageRouteAuth.ts"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { type ComponentProps } from "@solidjs/web";

export function GoSignInLinkButton(p: Omit<ComponentProps<typeof LinkButtonInternal>, "to" | "href">) {
  const [s, rest] = splitProps(p, ["icon", "children", "variant"])
  return (
    <LinkButtonInternal
      icon={s.icon ?? mdiHome}
      to={urlPageSignIn()}
      variant={s.variant ?? buttonVariant.outline}
      {...rest}
    >
      {ttc("Go to Sign-In")}
    </LinkButtonInternal>
  )
}
