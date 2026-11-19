import { type Element as JSXElement, Match, Switch } from "solid-js"
import * as a from "valibot"
import { api } from "#convex/_generated/api.js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { userTokenGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import type { FileModel } from "#src/file/model/FileModel.ts"
import { fileSchema } from "#src/file/model/fileSchema.ts"
import type { HasFileModel } from "#src/file/model/HasFileModel.ts"
import type { HasFileId } from "#src/file/model_field/HasFileId.ts"
import { ErrorPage } from "#src/ui/pages/ErrorPage.tsx"
import { LoadingSection } from "#src/ui/pages/LoadingSection.tsx"
import { createQueryCached } from "#src/utils/cache/createQueryCached.ts"
import { queryCreate } from "#src/utils/convex_client/queryCreate.ts"
import { resultHasData } from "#src/utils/result/resultHasData.ts"
import { resultHasErrorMessage } from "#src/utils/result/resultHasErrorMessage.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface FileLoaderProps extends HasFileId, MayHaveClass {
  FileComponent: (p: FileComponentProps) => JSXElement
}

export interface FileComponentProps extends HasFileModel, MayHaveClass {}

export function FileLoader(p: FileLoaderProps) {
  const getDataQuery = queryCreate(api.file.fileGetQuery, {
    token: userTokenGet(),
    fileId: p.fileId,
  })
  const getData = createQueryCached<FileModel | null>(
    getDataQuery,
    "fileGetQuery" + "/" + p.fileId,
    a.nullable(fileSchema),
  )
  // createEffect(() => {
  //   console.log("FileLoader", getData())
  // })
  return (
    <Switch>
      <Match when={!getData()}>
        <FileLoading />
      </Match>
      <Match when={resultHasErrorMessage(getData())}>{(errorMessage) => <ErrorPage title={errorMessage()} />}</Match>
      <Match when={resultHasData(getData())}>{(gotData) => p.FileComponent({ file: gotData(), class: p.class })}</Match>
    </Switch>
  )
}

function FileLoading() {
  return <LoadingSection loadingSubject={ttc("File")} />
}
