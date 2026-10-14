import { mdiArrowLeft } from "@adaptive-ds/mdi/mdiArrowLeft.js"
import { mdiEye } from "@adaptive-ds/mdi/mdiEye.js"
import { Show } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import type { AssignmentTarget } from "#src/assignment/model/assignmentTargetSchema.ts"
import { AssignmentTargetSelector } from "#src/assignment/ui/AssignmentTargetSelector.tsx"
import type { UploadAreaFileInfo } from "#src/file/ui/stats/UploadAreaFileInfo.ts"
import { UploadAreaFile } from "#src/file/ui/upload_file/UploadAreaFile.tsx"
import type { HasResourceId } from "#src/resource/model/HasResourceId.ts"
import { urlResourceList, urlResourceView } from "#src/resource/url/urlResource.ts"
import { classesCard } from "#src/ui/card/classesCard.ts"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { classArr } from "#ui/utils/classArr.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"
import { jsonStringifyPretty } from "#utils/json/jsonStringifyPretty.js"

export interface ResourceFileAddProps extends HasResourceId {}

export function ResourceFileAdd(p: ResourceFileAddProps) {
  const info = createSignalObject<UploadAreaFileInfo | null>(null)
  const uploaded = createSignalObject<string | null>(null)
  const error = createSignalObject<string | null>(null)
  const assignment = createSignalObject<AssignmentTarget | undefined>(undefined)

  function getUploadedInfo() {
    return jsonStringifyPretty(uploaded.get())
  }

  function hasUploaded() {
    return !!uploaded.get()
  }

  return (
    <>
      <div class="my-4 space-y-4">
        <AssignmentTargetSelector valueSignal={assignment} />
        <UploadAreaFile
          resourceId={p.resourceId}
          assignment={assignment.get()}
          hasUploaded={hasUploaded}
          info={info}
          error={error}
          onUploadSuccess={(data) => uploaded.set(data.url)}
          class={classArr(classesCard, "my-4")}
        />
      </div>
      <Show when={hasUploaded()}>
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
