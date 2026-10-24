import { mdiArrowLeft } from "@adaptive-ds/mdi/mdiArrowLeft.js"
import { mdiEye } from "@adaptive-ds/mdi/mdiEye.js"
import { Show } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { AssignmentTargetSelector } from "#src/assignment/ui/AssignmentTargetSelector.tsx"
import { resourceFileAddStateCreate } from "#src/file/ui/mutate/resourceFileAddStateCreate.ts"
import { UploadAreaFile } from "#src/file/ui/upload_file/UploadAreaFile.tsx"
import type { HasResourceId } from "#src/resource/model/HasResourceId.ts"
import { urlResourceList, urlResourceView } from "#src/resource/url/urlResource.ts"
import { classesCard } from "#src/ui/card/classesCard.ts"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { classArr } from "#ui/utils/classArr.ts"

export interface ResourceFileAddProps extends HasResourceId {}

export function ResourceFileAdd(p: ResourceFileAddProps) {
  const state = resourceFileAddStateCreate()

  return (
    <>
      <div class="my-4 space-y-4">
        <AssignmentTargetSelector valueSignal={state.assignment} />
        <UploadAreaFile
          resourceId={p.resourceId}
          assignment={state.assignment.get()}
          hasUploaded={state.hasUploaded}
          info={state.info}
          error={state.error}
          onUploadSuccess={(data) => state.markUploaded(data.url)}
          class={classArr(classesCard, "my-4")}
        />
      </div>
      <Show when={state.hasUploaded()}>
        <div class="flex flex-wrap gap-2 justify-center">
          <LinkButtonInternal variant={buttonVariant.link} icon={mdiArrowLeft} to={urlResourceList()}>
            {ttc("Resources")}
          </LinkButtonInternal>
          <LinkButtonInternal variant={buttonVariant.link} icon={mdiEye} to={urlResourceView(p.resourceId)}>
            {ttc("View resource")}
          </LinkButtonInternal>
        </div>
      </Show>
    </>
  )
}
