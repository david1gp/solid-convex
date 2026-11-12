import { For, Match, Switch } from "solid-js"
import { api } from "#convex/_generated/api.js"
import type { Result } from "#result"
import { ttc } from "#src/app/i18n/ttc.ts"
import { userSessionSignal, userTokenGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import type { FileModel } from "#src/file/model/FileModel.ts"
import { fileSchema } from "#src/file/model/fileSchema.ts"
import { FileCardView } from "#src/file/ui/list/FileCardView.tsx"
import type { HasResourceModel } from "#src/resource/model/HasResourceModel.ts"
import { ResourceViewInline } from "#src/resource/ui/view/inline/ResourceViewInline.tsx"
import { PaginationControls } from "#src/ui/pagination/PaginationControls.tsx"
import type { PaginationResultType } from "#src/utils/convex_backend/paginationResultType.ts"
import { cursorPaginationCreate } from "#src/utils/convex_client/cursorPaginationCreate.ts"
import { classArr } from "#ui/utils/classArr.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

interface ResourceViewInlineSectionProps extends HasResourceModel, MayHaveClass {}

export function ResourceViewInlineSection(p: ResourceViewInlineSectionProps) {
  return (
    <section class={classArr("rounded-md border border-border bg-background", "p-4", p.class)}>
      <ResourceViewInline showCardWrapper={false} showMetaDates={false} {...p} />
      <h3 class="text-sm font-semibold text-muted-foreground mt-4 mb-2">{ttc("Files")}</h3>
      <FileLoader {...p} />
    </section>
  )
}

export function FileLoader(p: ResourceViewInlineSectionProps) {
  const pagination = cursorPaginationCreate({
    query: api.resource.resourceFileListQuery,
    queryKey: "resourceFileListQuery",
    args: () => ({ token: userTokenGet(), resourceId: p.resource.resourceId }),
    identity: () => userSessionSignal.get()?.profile.userId ?? null,
    scope: () => p.resource.resourceId,
    itemSchema: fileSchema,
  })

  return (
    <Switch>
      <Match when={!pagination.page()}>
        <p class={classArr("text-muted-foreground")}>{ttc("Loading files...")}</p>
      </Match>
      <Match when={resultHasNoFiles(pagination.page())}>
        <p class="text-muted-foreground mt-4">{ttc("No files in this resource")}</p>
      </Match>
      <Match when={getFilesPage(pagination.page())}>
        {(getPage) => (
          <div class={classArr("flex flex-col gap-4")}>
            <For each={getPage().page}>{(file) => <FileCardView resourceId={p.resource.resourceId} file={file} />}</For>
            <PaginationControls
              page={() => pagination.history().length + 1}
              canPrevious={pagination.canPrevious}
              canNext={pagination.canNext}
              previous={pagination.previous}
              next={pagination.next}
              loading={pagination.loading}
            />
          </div>
        )}
      </Match>
    </Switch>
  )
}

function getFilesPage(
  result: Result<PaginationResultType<FileModel>> | undefined,
): PaginationResultType<FileModel> | null {
  if (!result?.success) return null
  return result.data
}

function resultHasNoFiles(result: Result<PaginationResultType<FileModel>> | undefined): boolean {
  const page = getFilesPage(result)
  return page !== null && page.page.length <= 0
}
