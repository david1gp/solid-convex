import { mdiEmail } from "@adaptive-ds/mdi/mdiEmail.js"
import { mdiHelpCircleOutline } from "@adaptive-ds/mdi/mdiHelpCircleOutline.js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { urlSupportMailTo, urlSupportTelegram } from "#src/app/url/urlSupport.ts"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonExternal } from "#ui/interactive/link/LinkButton.jsx"
import { CorvuPopoverIcon } from "#ui/interactive/popover/CorvuPopoverIcon.jsx"
import { iconTelegram } from "#ui/static/icons/iconTelegram.ts"

import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface SupportPopoverProps extends MayHaveClass {}

export function SupportPopover(p: SupportPopoverProps) {
  const getTitle = () => ttc("Support")
  return (
    <CorvuPopoverIcon
      icon={mdiHelpCircleOutline}
      variant={buttonVariant.ghost}
      class={p.class}
      title={getTitle()}
      innerClass="flex flex-col gap-2"
    >
      <h3 class="text-lg font-medium ml-3">{getTitle()}</h3>
      <LinkButtonExternal href={urlSupportMailTo} icon={mdiEmail} variant={buttonVariant.link} class="justify-start">
        {ttc("E-Mail")}
      </LinkButtonExternal>
      <LinkButtonExternal
        href={urlSupportTelegram}
        icon={iconTelegram}
        variant={buttonVariant.link}
        class="justify-start"
      >
        {ttc("Telegram Group")}
      </LinkButtonExternal>
    </CorvuPopoverIcon>
  )
}
