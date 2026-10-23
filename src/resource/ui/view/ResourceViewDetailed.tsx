import { Show, splitProps } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import type { HasResourceModel } from "#src/resource/model/HasResourceModel.ts"
import { ResourceTypeBadge } from "#src/resource/ui/view/ResourceTypeBadge.tsx"
import { urlResourceEdit } from "#src/resource/url/urlResource.ts"
import { PageHeader } from "#src/ui/header/PageHeader.tsx"
import { MetaSectionDisplay } from "#src/ui/section/MetaSectionDisplay.tsx"
import { MetaSectionSummary } from "#src/ui/section/MetaSectionSummary.tsx"
import { MetaSectionTechnical } from "#src/ui/section/MetaSectionTechnical.tsx"
import { formModeIcon } from "#ui/input/form/formModeIcon.ts"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonIconOnlyInternal } from "#ui/interactive/link/LinkButtonIconOnly.jsx"
import { classesGridCols3xl } from "#ui/static/grid/classesGridCols3xl.ts"
import { classArr } from "#ui/utils/classArr.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface ResourceViewProps extends HasResourceModel, MayHaveClass {
  showCardWrapper?: boolean
  showMetaDates?: boolean
  editHref?: string
}

export function ResourceViewDetailed(p: ResourceViewProps) {
  const [s, rest] = splitProps(p, ["class"])
  return (
    <div class={classArr(classesGridCols3xl, "gap-4", s.class)}>
      <ShowImage {...rest} />
      <Header {...rest} />
      <MetaSectionSummary description={rest.resource.description} />
      <MetaSectionTechnical
        id={p.resource.resourceId}
        updatedAt={p.resource.updatedAt}
        createdAt={p.resource.createdAt}
      />
    </div>
  )
}

function ShowImage(p: ResourceViewProps) {
  return (
    <Show when={p.resource.image}>
      <img
        src={p.resource.image!}
        alt={ttc("Image for ") + (p.resource.name || "Resource")}
        class={classArr("max-w-xl h-auto rounded-xl", "col-span-full mx-auto", p.class)}
      />
    </Show>
  )
}

function Header(p: ResourceViewProps) {
  return (
    <PageHeader
      title={p.resource.name || "Untitled Resource"}
      titleClass="text-2xl sm:text-4xl font-bold"
      class="col-span-full mx-auto"
      subtitleChildren={
        <MetaSectionDisplay visibility={p.resource.visibility} language={p.resource.language}>
          <ResourceTypeBadge type={p.resource.type} />
        </MetaSectionDisplay>
      }
    >
      <LinkButtonIconOnlyInternal
        to={p.editHref ?? urlResourceEdit(p.resource.resourceId)}
        variant={buttonVariant.ghost}
        icon={formModeIcon.edit}
        title={ttc("Edit")}
      />
    </PageHeader>
  )
}
