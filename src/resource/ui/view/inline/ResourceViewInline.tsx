import { Show, splitProps } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import type { HasResourceModel } from "#src/resource/model/HasResourceModel.ts"
import { ResourceTypeBadge } from "#src/resource/ui/view/ResourceTypeBadge.tsx"
import { urlResourceEdit, urlResourceView } from "#src/resource/url/urlResource.ts"
import { UpdatedAtCreatedAt } from "#src/ui/date/UpdatedAtCreatedAt.tsx"
import { MetaSectionSummary } from "#src/ui/section/MetaSectionSummary.tsx"
import { Ps } from "#src/ui/text/Ps.tsx"
import { formModeIcon } from "#ui/input/form/formModeIcon.ts"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { LinkButtonIconOnlyInternal } from "#ui/interactive/link/LinkButtonIconOnly.jsx"
import { classesCardWrapper } from "#ui/static/card/classesCardWrapper.ts"
import { classArr } from "#ui/utils/classArr.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface ResourceViewInlineProps extends HasResourceModel, MayHaveClass {
  showCardWrapper?: boolean
  showMetaDates?: boolean
}

export function ResourceViewInline(p: ResourceViewInlineProps) {
  const [s, rest] = splitProps(p, ["class"])
  return (
    <div class={classArr("flex flex-col xl:flex-row flex-wrap gap-8", s.class)}>
      <Left {...rest} class="order-2 xl:order-1" />
      <Right {...rest} class="order-1 xl:order-2" />
    </div>
  )
}

function Left(p: ResourceViewInlineProps) {
  return (
    <div class={classArr("flex-1", "flex flex-col gap-4", p.class)}>
      <div
        class={classArr(
          p.showCardWrapper || p.showCardWrapper === undefined ? classesCardWrapper : "",
          "flex-1",
          "flex flex-col gap-4",
        )}
      >
        <ShowName {...p} />
        <MetaSectionSummary description={p.resource.description} />
      </div>
      {/* <ShowDates {...p} /> */}
    </div>
  )
}

function Right(p: ResourceViewInlineProps) {
  return <ShowImage {...p} />
}

function ShowName(p: ResourceViewInlineProps) {
  return (
    <div class="flex flex-wrap justify-between items-center">
      <div>
        <h3>
          <LinkButtonInternal
            to={urlResourceView(p.resource.resourceId)}
            variant={buttonVariant.link}
            class={classArr("text-2xl font-bold", "pl-0")}
          >
            {p.resource.name ?? ttc("Unnamed Resource")}
          </LinkButtonInternal>
        </h3>
        <Show when={p.resource.description}>
          {(getDescription) => (
            <div class="text-pretty">
              <Ps text={getDescription()} />
            </div>
          )}
        </Show>
        <ResourceTypeBadge type={p.resource.type} class="w-content mt-2" />
      </div>
      <LinkButtonIconOnlyInternal
        to={urlResourceEdit(p.resource.resourceId)}
        variant={buttonVariant.ghost}
        icon={formModeIcon.edit}
        title={ttc("Edit")}
      />
    </div>
  )
}

function ShowDates(p: ResourceViewInlineProps) {
  return <UpdatedAtCreatedAt updatedAt={p.resource.updatedAt} createdAt={p.resource.createdAt} />
}

function ShowImage(p: ResourceViewInlineProps) {
  return (
    <Show when={p.resource.image}>
      {(getImageUrl) => (
        <img
          src={getImageUrl()}
          alt={ttc("Image for ") + (p.resource.name || "Resource")}
          class={classArr("max-w-xl h-auto rounded-md", p.class)}
        />
      )}
    </Show>
  )
}
