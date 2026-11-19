import { mdiHome } from "@adaptive-ds/mdi/mdiHome.js"
import { omit } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { type ComponentProps } from "@solidjs/web"

export function GoHomeLinkButton(
  p: Omit<ComponentProps<typeof LinkButtonInternal>, "to" | "href"> & { homeHref?: string },
) {
  const rest = omit(p, "icon", "variant", "children", "homeHref")
  return (
    <LinkButtonInternal
      icon={p.icon ?? mdiHome}
      to={p.homeHref ?? "/"}
      variant={p.variant ?? buttonVariant.outline}
      {...rest}
    >
      {ttc("Take me home")}
    </LinkButtonInternal>
  )
}
