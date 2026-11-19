import { mdiAlertCircle } from "@adaptive-ds/mdi/mdiAlertCircle.js"
import { mdiCloudUpload } from "@adaptive-ds/mdi/mdiCloudUpload.js"
import { mdiFile } from "@adaptive-ds/mdi/mdiFile.js"
import { mdiLoading } from "@adaptive-ds/mdi/mdiLoading.js"
import { Match, Show, Switch } from "solid-js"
import { type UploadStatus, uploadFileTexts, uploadStatus } from "#src/file/model_field/uploadStatus.ts"
import type { UploadAreaFileInfo } from "#src/file/ui/stats/UploadAreaFileInfo.ts"
import { Icon } from "#ui/static/icon/Icon.jsx"
import { classArr } from "#ui/utils/classArr.ts"
import { type JSX } from "@solidjs/web"

interface UploadAreaFileViewProps {
  status: UploadStatus
  error?: string | null
  info?: UploadAreaFileInfo | null
}

export function UploadAreaFileView(p: UploadAreaFileViewProps): JSX.Element {
  return (
    <Switch>
      <Match when={p.status === uploadStatus.error}>
        <ViewError error={p.error!} />
      </Match>
      <Match when={p.status === uploadStatus.uploading}>
        <ViewUploading info={p.info!} />
      </Match>
      <Match when={p.status === uploadStatus.uploaded}>
        <ViewUploaded info={p.info!} />
      </Match>
      <Match when={p.status === uploadStatus.empty}>
        <ViewEmpty />
      </Match>
    </Switch>
  )
}

const iconClasses = "size-32"
const iconClassesGray = "fill-gray-400 dark:fill-gray-400"
const imageClasses = "size-32 rounded-lg object-cover"

function ViewEmpty() {
  return (
    <>
      <Icon path={mdiCloudUpload} class={classArr(iconClasses, iconClassesGray)} />
      <div class="text-center">
        <p class="text-xl font-medium">{uploadFileTexts.clickToUpload()}</p>
        <p class="text-muted-foreground">{uploadFileTexts.max20()}</p>
      </div>
    </>
  )
}

function ViewUploading(p: { info: UploadAreaFileInfo }) {
  return (
    <>
      <Show
        when={p.info.preview}
        fallback={<Icon path={mdiLoading} class={classArr(iconClasses, "animate-spin", iconClassesGray)} />}
      >
        <img src={p.info.preview} alt={uploadFileTexts.preview()} class={imageClasses} />
      </Show>
      <div class="text-center">
        <p class="text-xl font-medium">{uploadFileTexts.uploadingText()}</p>
      </div>
    </>
  )
}

function ViewUploaded(p: { info: UploadAreaFileInfo }) {
  return (
    <>
      <Show when={p.info.preview} fallback={<Icon path={mdiFile} class={classArr(iconClasses, iconClassesGray)} />}>
        <img src={p.info.preview} alt={uploadFileTexts.preview()} class={imageClasses} />
      </Show>
      <div class="text-center">
        <p class="text-xl font-medium">{uploadFileTexts.success()}</p>
        <p class="text-muted-foreground">{uploadFileTexts.uploadAnotherFileQuestion()}</p>
      </div>
    </>
  )
}

function ViewError(p: { error: string }) {
  return (
    <>
      <Icon path={mdiAlertCircle} class={classArr(iconClasses, "fill-red-500")} />
      <p class="text-xl font-medium text-red-500">{p.error}</p>
      <p class="text-xl font-medium">{uploadFileTexts.chooseAnotherFile()}</p>
    </>
  )
}
