import { Show } from "solid-js"
import { LayoutWrapperApp } from "#src/app/layout/LayoutWrapperApp.tsx"
import { UploadAreaFile } from "#src/file/ui/upload_file/UploadAreaFile.tsx"
import { r2UploadContentStateCreate } from "#src/r2/ui/r2UploadContentStateCreate.ts"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"
import type { SignalObject } from "#ui/utils/createSignalObject.ts"

export function DemoR2Upload() {
  return (
    <LayoutWrapperApp>
      <PageWrapper>
        <R2UploadContent />
      </PageWrapper>
    </LayoutWrapperApp>
  )
}

function R2UploadContent() {
  const state = r2UploadContentStateCreate()

  return (
    <>
      <UploadAreaFile hasUploaded={state.hasUploaded} info={state.info} handler={state.handleInput} />
      <ProgressView progress={state.progress} />
      <ResultView uploaded={state.uploaded} />
    </>
  )
}

function ProgressView(p: { progress: SignalObject<{ loaded: number; total: number } | null> }) {
  const progress = p.progress
  return (
    <Show when={progress.get()}>
      <div>
        <div>
          Progress: {progress.get()!.loaded} / {progress.get()!.total} bytes
        </div>
        <div class="w-full bg-gray-200 h-2">
          <div
            class="bg-blue-500 h-2"
            style={{
              width: `${(progress.get()!.loaded / progress.get()!.total) * 100}%`,
            }}
          />
        </div>
      </div>
    </Show>
  )
}

function ResultView(p: { uploaded: SignalObject<string | null> }) {
  return (
    <Show when={p.uploaded.get()}>
      <pre class="bg-gray-100 p-4 overflow-auto text-xs">{p.uploaded.get()}</pre>
    </Show>
  )
}
