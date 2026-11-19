import { mdiAlertCircle } from "@adaptive-ds/mdi/mdiAlertCircle.js"
import { mdiCloudUpload } from "@adaptive-ds/mdi/mdiCloudUpload.js"
import { mdiImage } from "@adaptive-ds/mdi/mdiImage.js"
import { Match, Show, Switch } from "solid-js"
import {
  type UploadStatus,
  uploadFileTexts,
  uploadImageTexts,
  uploadStatus,
} from "#src/file/model_field/uploadStatus.ts"
import type { UploadAreaFileInfo } from "#src/file/ui/stats/UploadAreaFileInfo.ts"
import { Icon } from "#ui/static/icon/Icon.jsx"
import { classArr } from "#ui/utils/classArr.ts"
import { type JSX } from "@solidjs/web";

interface UploadAreaViewProps {
  status: UploadStatus
  error?: string | null
  info?: UploadAreaFileInfo | null
}

export function UploadAreaImageView(p: UploadAreaViewProps): JSX.Element {
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
        <p class="text-xl font-medium">{uploadImageTexts.clickToUpload()}</p>
        <p class="text-muted-foreground">{uploadImageTexts.max20()}</p>
      </div>
    </>
  )
}

function ViewUploading(p: { info: UploadAreaFileInfo }) {
  return (
    <>
      <Show
        when={p.info.preview}
        fallback={<Icon path={mdiImage} class={classArr(iconClasses, "animate-spin", iconClassesGray)} />}
      >
        <img src={p.info.preview} alt={uploadFileTexts.preview()} class={imageClasses} />
      </Show>
      <div class="text-center">
        <p class="text-xl font-medium">{uploadImageTexts.uploadingText()}</p>
      </div>
    </>
  )
}

function ViewUploaded(p: { info: UploadAreaFileInfo }) {
  return (
    <>
      <Show when={p.info.preview} fallback={<Icon path={mdiImage} class={classArr(iconClasses, iconClassesGray)} />}>
        <img src={p.info.preview} alt={uploadFileTexts.preview()} class={imageClasses} />
      </Show>
      <div class="text-center">
        <p class="text-xl font-medium">{uploadImageTexts.success()}</p>
        <p class="text-muted-foreground">{uploadImageTexts.uploadAnotherFile()}</p>
      </div>
    </>
  )
}

function ViewError(p: { error: string }) {
  return (
    <>
      <Icon path={mdiAlertCircle} class={classArr(iconClasses, "fill-red-500")} />
      <p class="text-xl font-medium text-red-500">{p.error}</p>
      <p class="text-xl font-medium">{uploadImageTexts.chosseAnotherFile()}</p>
    </>
  )
}
