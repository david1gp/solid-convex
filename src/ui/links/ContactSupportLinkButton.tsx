import { mdiEmail } from "@adaptive-ds/mdi/mdiEmail.js"
import { omit } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { urlSupportMailTo } from "#src/app/url/urlSupport.ts"
import { LinkButtonExternal } from "#ui/interactive/link/LinkButton.jsx"
import type { ButtonAnchorProps } from "#ui/interactive/link/LinkButtonProps.jsx"

export function ContactSupportLinkButton(p: Omit<ButtonAnchorProps, "href">) {
  const rest = omit(p, "icon", "children")
  return (
    <LinkButtonExternal icon={p.icon ?? mdiEmail} href={urlSupportMailTo} {...rest}>
      {ttc("Contact support")}
    </LinkButtonExternal>
  )
}
