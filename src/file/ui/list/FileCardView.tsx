import { mdiDownload } from "@adaptive-ds/mdi/mdiDownload.js"
import { mdiEye } from "@adaptive-ds/mdi/mdiEye.js"
import { Show } from "solid-js"
import { language, languageOrNone } from "#src/app/i18n/language.ts"
import { ttc } from "#src/app/i18n/ttc.ts"
import type { HasFileModel } from "#src/file/model/HasFileModel.ts"
import { downloadFileByUrl } from "#src/file/ui/list/downloadFileByUrl.tsx"
import { bytesToFormatedText } from "#src/file/ui/stats/bytesToFormatedText.ts"
import type { MayHaveResourceId } from "#src/resource/model/MayHaveResourceId.ts"
import { classesCard } from "#src/ui/card/classesCard.ts"
import { ClipboardCopyButtonIcon } from "#src/ui/links/ClipboardCopyButtonIcon.tsx"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonExternal } from "#ui/interactive/link/LinkButton.jsx"
import { cn } from "cn"
import type { MayHaveChildren } from "#ui/utils/MayHaveChildren.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface FileCardViewProps extends MayHaveResourceId, HasFileModel, MayHaveClass, MayHaveChildren {
  showDownload?: boolean
}

export function FileCardView(p: FileCardViewProps) {
  return (
    <article
      class={cn(
        classesCard,
        "flex flex-col", // layout children
        p.class,
      )}
    >
      <div class="flex flex-wrap gap-2">
        <h3 class="text-xl font-semibold break-all font-mono flex items-center flex-1">{p.file.displayName}</h3>
        {p.children}
      </div>
      <div class="flex flex-wrap gap-6 text-muted-foreground mb-2">
        <Show when={p.file.language !== languageOrNone.none}>
          <span>{(p.file.language || language.en).toUpperCase()}</span>
          <div>•</div>
        </Show>
        <div>{bytesToFormatedText(p.file.fileSize)}</div>
        <div>•</div>
        <div>{p.file.contentType}</div>
      </div>
      <div class="flex flex-wrap gap-2">
        {(p.showDownload === undefined || p.showDownload) && (
          <ButtonIcon
            icon={mdiDownload}
            variant={buttonVariant.subtle}
            onClick={(e) => {
              e.preventDefault()
              downloadFileByUrl(p.file.url, p.file.displayName)
            }}
            class="flex-1"
          >
            {ttc("Download")}
          </ButtonIcon>
        )}
        <LinkButtonExternal icon={mdiEye} href={p.file.url} variant={buttonVariant.subtle} newTab class="flex-1">
          {ttc("View")}
        </LinkButtonExternal>
        <ClipboardCopyButtonIcon
          variant={buttonVariant.subtle}
          data={p.file.url}
          copyText={ttc("Copy URL to clipboard")}
          toastText={ttc("URL copied")}
        >
          {ttc("Copy URL")}
        </ClipboardCopyButtonIcon>
      </div>
    </article>
  )
}
