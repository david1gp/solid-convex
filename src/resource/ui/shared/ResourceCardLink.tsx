import { mdiTag } from "@adaptive-ds/mdi/mdiTag.js"
import { Show } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import type { ResourceModel } from "#src/resource/model/ResourceModel.ts"
import { resourceTypeGetText } from "#src/resource/model_field/resourceTypeGetText.ts"
import { urlResourceView } from "#src/resource/url/urlResource.ts"
import { classesCard } from "#src/ui/card/classesCard.ts"
import { IconTextPair } from "#src/ui/card/IconTextPair.tsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { classMerge } from "#ui/utils/classMerge.ts"

export interface ResourceCardLinkProps {
  resource: ResourceModel
  class?: string
  href?: string
}

export function ResourceCardLink(p: ResourceCardLinkProps) {
  return (
    <LinkButtonInternal
      variant={buttonVariant.filled}
      to={p.href ?? urlResourceView(p.resource.resourceId)}
      class={classMerge(
        classesCard,
        "pl-4",
        // "flex flex-col gap-2",
        "grid grid-cols-1 gap-4",
        p.resource.image && "lg:grid-cols-2",
        "rounded-md border-border bg-background dark:border-border dark:bg-background",
        "h-auto items-start justify-start text-left",
        p.class,
      )}
    >
      <div class="flex flex-col gap-1">
        <h3 class="text-lg font-semibold mb-2">{p.resource.name}</h3>

        <Show when={p.resource.type}>
          {(getType) => <IconTextPair icon={mdiTag}>{resourceTypeGetText(getType())}</IconTextPair>}
        </Show>
      </div>

      <Show when={p.resource.image}>
        <img src={p.resource.image!} alt={ttc("Resource image")} class="w-full max-h-25 object-cover rounded-lg" />
      </Show>
    </LinkButtonInternal>
  )
}
