import { mdiDownload } from "@adaptive-ds/mdi/mdiDownload.js"
import { mdiEye } from "@adaptive-ds/mdi/mdiEye.js"
import { Show } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import type { HasFileModel } from "#src/file/model/HasFileModel.ts"
import { downloadFileByUrl } from "#src/file/ui/list/downloadFileByUrl.tsx"
import { urlFileEdit, urlFileRemove } from "#src/file/url/urlFile.ts"
import type { HasResourceId } from "#src/resource/model/HasResourceId.ts"
import { ClipboardCopyButtonIconOnly } from "#src/ui/links/ClipboardCopyButtonIconOnly.tsx"
import { formMode, getFormModeTitle, type HasFormMode } from "#ui/input/form/formMode.ts"
import { formModeIcon } from "#ui/input/form/formModeIcon.ts"
import { ButtonIconOnly } from "#ui/interactive/button/ButtonIconOnly.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonIconOnlyExternal, LinkButtonIconOnlyInternal } from "#ui/interactive/link/LinkButtonIconOnly.jsx"
import { classesCardWrapper } from "#ui/static/card/classesCardWrapper.ts"
import { cn } from "cn"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

interface FileCardLineProps extends HasResourceId, HasFormMode, HasFileModel, MayHaveClass {}

export function FileCardLine(p: FileCardLineProps) {
  return (
    <article
      class={cn(
        classesCardWrapper,
        "shadow-sm", // override card style
        "pl-4 pr-2 py-2", // padding
        "flex flex-wrap gap-2", // layout children
        p.class,
      )}
    >
      <h3 class="text-lg font-semibold break-all font-mono flex items-center flex-1">{p.file.displayName}</h3>
      <LinkButtonIconOnlyExternal
        icon={mdiEye}
        href={p.file.url}
        variant={buttonVariant.ghost}
        newTab
        title={ttc("View")}
      />
      <ButtonIconOnly
        icon={mdiDownload}
        variant={buttonVariant.ghost}
        title={ttc("Download")}
        onClick={(e) => {
          e.preventDefault()
          downloadFileByUrl(p.file.url, p.file.displayName)
        }}
      />
      <ClipboardCopyButtonIconOnly
        variant={buttonVariant.ghost}
        data={p.file.url}
        copyText={ttc("Copy URL to clipboard")}
        toastText={ttc("URL copied")}
      />

      <Show when={p.mode !== formMode.view}>
        <>
          <LinkButtonIconOnlyInternal
            icon={formModeIcon.edit}
            to={urlFileEdit(p.resourceId, p.file.fileId)}
            variant={buttonVariant.ghost}
            title={getFormModeTitle(formMode.edit, "File")}
          />
          <LinkButtonIconOnlyInternal
            icon={formModeIcon.remove}
            to={urlFileRemove(p.resourceId, p.file.fileId)}
            variant={buttonVariant.ghost}
            title={getFormModeTitle(formMode.remove, "File")}
          />
        </>
      </Show>
    </article>
  )
}
