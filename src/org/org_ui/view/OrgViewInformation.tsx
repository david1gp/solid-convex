import { mdiHandWave } from "@adaptive-ds/mdi/mdiHandWave.js"
import { Show } from "solid-js"
import { appIcons } from "#src/app/icon/appIcons.ts"
import { ttc } from "#src/app/i18n/ttc.ts"
import type { OrgModel } from "#src/org/org_model/OrgModel.ts"
import { orgPageSection } from "#src/org/org_ui/view/orgPageSection.tsx"
import { urlOrgEdit } from "#src/org/org_url/urlOrg.ts"
import { Ps } from "#src/ui/text/Ps.tsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { Icon } from "#ui/static/icon/Icon.jsx"
import { Img } from "#ui/static/img/Img.jsx"
import { classArr } from "#ui/utils/classArr.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface OrgViewProps extends MayHaveClass {
  org: OrgModel
  showEditButton: boolean
  editHref?: string
}

export function OrgViewInformation(p: OrgViewProps) {
  return (
    <section id={orgPageSection.org} class="text-left">
      <ShowImg {...p} />
      <div class="flex items-center gap-2">
        <h1 class="text-lg font-semibold">{p.org.name}</h1>
        {p.showEditButton && (
          <LinkButtonInternal
            to={p.editHref ?? urlOrgEdit(p.org.orgHandle)}
            variant={buttonVariant.outline}
            icon={appIcons.edit}
            class="ml-auto"
          >
            {ttc("Edit")}
          </LinkButtonInternal>
        )}
      </div>
      <ShowDescription {...p} />
      <ShowUrl {...p} />
    </section>
  )
}

function ShowImg(p: OrgViewProps) {
  return (
    <Show when={p.org.image}>
      {(getImageUrl) => (
        <Img src={getImageUrl()} alt={ttc("Logo of ") + " " + p.org.name} class={classArr("h-40 rounded-md mb-6")} />
      )}
    </Show>
  )
}

function ImageFallBack() {
  return (
    <Icon
      path={mdiHandWave}
      class={classArr(
        " mx-auto",
        "size-40", // size
        "p-6",
        "fill-white text-white bg-primary", // bg
        "rounded-md",
      )}
    />
  )
}

function ShowDescription(p: OrgViewProps) {
  return (
    <Show when={p.org.description}>
      {(getDescription) => (
        <div class="text-sm text-muted-foreground text-pretty mb-4">
          <Ps text={getDescription()} />
        </div>
      )}
    </Show>
  )
}

function ShowUrl(p: OrgViewProps) {
  return (
    <Show when={p.org.url}>
      {(getUrl) => (
        <a
          href={getUrl()}
          class={classArr(
            "text-lg font-semibold",
            "text-foreground", // text color
            "underline decoration-2 underline-offset-4",
          )}
        >
          {getUrl()}
        </a>
      )}
    </Show>
  )
}
