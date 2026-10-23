import { For, Match, Show, Switch } from "solid-js"
import { api } from "#convex/_generated/api.js"
import type { Result } from "#result"
import { ttc } from "#src/app/i18n/ttc.ts"
import { appTabIcon } from "#src/app/tabs/appTab.ts"
import { userSessionSignal, userTokenGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import type { FileModel } from "#src/file/model/FileModel.ts"
import { fileSchema } from "#src/file/model/fileSchema.ts"
import { FileCardEdit } from "#src/file/ui/list/FileCardEdit.tsx"
import { urlFileUpload } from "#src/file/url/urlFile.ts"
import type { HasResourceId } from "#src/resource/model/HasResourceId.ts"
import { SectionHeader } from "#src/ui/header/SectionHeader.tsx"
import { ErrorPage } from "#src/ui/pages/ErrorPage.tsx"
import { LoadingSection } from "#src/ui/pages/LoadingSection.tsx"
import { PaginationControls } from "#src/ui/pagination/PaginationControls.tsx"
import type { PaginationResultType } from "#src/utils/convex_backend/paginationResultType.ts"
import { cursorPaginationCreate } from "#src/utils/convex_client/cursorPaginationCreate.ts"
import { resultHasErrorMessage } from "#src/utils/result/resultHasErrorMessage.ts"
import { formMode, type HasFormMode } from "#ui/input/form/formMode.ts"
import { formModeIcon } from "#ui/input/form/formModeIcon.ts"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonIconOnlyInternal } from "#ui/interactive/link/LinkButtonIconOnly.jsx"
import { classesGridCols2xl } from "#ui/static/grid/classesGridCols2xl.ts"
import { classArr } from "#ui/utils/classArr.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface ResourceFileListProps extends HasResourceId, HasFormMode, MayHaveClass {}

export function ResourceFileListLoader(p: ResourceFileListProps) {
  const pagination = cursorPaginationCreate({
    query: api.resource.resourceFileListQuery,
    queryKey: "resourceFileListQuery",
    args: () => ({ token: userTokenGet(), resourceId: p.resourceId }),
    identity: () => userSessionSignal.get()?.profile.userId ?? null,
    scope: () => p.resourceId,
    itemSchema: fileSchema,
  })

  return (
    <section class="contents">
      <Show when={p.mode === formMode.view}>
        <SectionHeader
          title={ttc("Files")}
          to={urlFileUpload(p.resourceId)}
          icon={appTabIcon.resource}
          class="mt-4 mb-1"
        >
          <LinkButtonIconOnlyInternal
            icon={formModeIcon.edit}
            to={urlFileUpload(p.resourceId)}
            variant={buttonVariant.ghost}
            title={ttc("Manage")}
            class="hover:bg-gray-200"
          />
        </SectionHeader>
      </Show>

      <Switch fallback={<ErrorPage title={ttc("Missing Switch")} />}>
        <Match when={pagination.page() === undefined}>
          <ResourceFileListIsLoading />
        </Match>
        <Match when={resultHasErrorMessage(pagination.page())}>
          {(getErrorMessage) => <ErrorPage title={getErrorMessage()} />}
        </Match>
        <Match when={resultHasNoFiles(pagination.page())}>
          <NoFiles
            class={p.mode === formMode.add ? "text-center" : undefined}
            text={p.mode === formMode.add ? ttc("No uploaded files yet") : undefined}
          />
        </Match>
        <Match when={getFilesPage(pagination.page())}>
          {(getPage) => (
            <>
              <FileList mode={p.mode} resourceId={p.resourceId} files={getPage().page} />
              <PaginationControls
                page={() => pagination.history().length + 1}
                canPrevious={pagination.canPrevious}
                canNext={pagination.canNext}
                previous={pagination.previous}
                next={pagination.next}
                loading={pagination.loading}
              />
            </>
          )}
        </Match>
      </Switch>
    </section>
  )
}

function ResourceFileListIsLoading() {
  return <LoadingSection loadingSubject={ttc("Resource files")} />
}

interface NoFilesProps extends MayHaveClass {
  text?: string
}

function NoFiles(p: NoFilesProps) {
  return <p class={classArr("text-muted-foreground", p.class)}>{p.text ?? ttc("No files yet")}</p>
}

interface FileListProps extends HasFormMode, HasResourceId {
  files: FileModel[]
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

function FileList(p: FileListProps) {
  return (
    <div class={classArr(p.files.length >= 2 && classesGridCols2xl, "gap-4")}>
      <For each={p.files}>{(r) => <FileCardEdit resourceId={p.resourceId} file={r} />}</For>
    </div>
  )
}
