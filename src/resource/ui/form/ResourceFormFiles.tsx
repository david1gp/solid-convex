import { For, Show, splitProps } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import type { FileModel } from "#src/file/model/FileModel.ts"
import { FileCardView, type FileCardViewProps } from "#src/file/ui/list/FileCardView.tsx"
import { UploadAreaFile } from "#src/file/ui/upload_file/UploadAreaFile.tsx"
import { resourceFormFilesStateCreate } from "#src/resource/ui/form/resourceFormFilesStateCreate.ts"
import type { ResourceFormStateManagement } from "#src/resource/ui/form/resourceFormStateManagement.ts"
import { classesCard } from "#src/ui/card/classesCard.ts"
import { formMode, getFormModeTitle } from "#ui/input/form/formMode.ts"
import { formModeIcon } from "#ui/input/form/formModeIcon.ts"
import { Label } from "#ui/input/label/Label.jsx"
import { ButtonIconOnly } from "#ui/interactive/button/ButtonIconOnly.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { classArr } from "#ui/utils/classArr.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

interface HasResourceFormStateManagement {
  sm: ResourceFormStateManagement
}

export function ResourceFormFiles(p: HasResourceFormStateManagement) {
  const state = resourceFormFilesStateCreate({ sm: () => p.sm })

  return (
    <div class="space-y-4">
      {/* Display existing uploaded files */}
      <UploadedFilesList getCurrentFiles={state.getCurrentFiles} handleRemoveFile={state.handleRemoveFile} />

      {/* Upload new files */}
      <div class="flex flex-col gap-2">
        <Label>{ttc("Upload file")}</Label>
        <UploadAreaFile
          resourceId={state.persistedResourceId()}
          assignment={state.assignment()}
          hasUploaded={state.hasUploaded}
          info={state.uploadInfo}
          error={state.uploadError}
          onUploadSuccess={state.fileUploadSuccess}
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
          class={classArr(classesCard)}
        />
      </div>

      {/* Show error if any */}
      <Show when={state.errorMessage()}>
        <p class="text-destructive text-sm">{state.errorMessage()}</p>
      </Show>
    </div>
  )
}

interface UploadedFilesListProps extends MayHaveClass {
  getCurrentFiles(): FileModel[]
  handleRemoveFile: (fileId: string) => void
}

function UploadedFilesList(p: UploadedFilesListProps) {
  return (
    <div class="space-y-2">
      <Label>{ttc("Uploaded files")}</Label>
      <div class="space-y-2">
        <For each={p.getCurrentFiles()} fallback={<p class="text-muted-foreground">{ttc("No files uploaded yet")}</p>}>
          {(file) => <FileCardEdit handleRemoveFile={p.handleRemoveFile} file={file} />}
        </For>
      </div>
    </div>
  )
}

interface FileCardProps extends FileCardViewProps {
  handleRemoveFile: (fileId: string) => void
}

function FileCardEdit(p: FileCardProps) {
  const [s, rest] = splitProps(p, ["handleRemoveFile"])
  return (
    <FileCardView {...rest} showDownload={false}>
      <ButtonIconOnly
        icon={formModeIcon.remove}
        variant={buttonVariant.ghost}
        title={getFormModeTitle(formMode.remove, "File")}
        onClick={() => s.handleRemoveFile(p.file.fileId)}
      />
    </FileCardView>
  )
}
