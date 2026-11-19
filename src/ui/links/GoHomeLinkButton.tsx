import { mdiHome } from "@adaptive-ds/mdi/mdiHome.js"
import { splitProps } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { type ComponentProps } from "@solidjs/web";

export function GoHomeLinkButton(
  p: Omit<ComponentProps<typeof LinkButtonInternal>, "to" | "href"> & { homeHref?: string },
) {
  const [s, rest] = splitProps(p, ["icon", "variant", "children", "homeHref"])
  return (
    <LinkButtonInternal
      icon={s.icon ?? mdiHome}
      to={s.homeHref ?? "/"}
      variant={s.variant ?? buttonVariant.outline}
      {...rest}
    >
      {ttc("Take me home")}
    </LinkButtonInternal>
  )
}
