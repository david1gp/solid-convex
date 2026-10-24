import { demoUploadAreaStateCreate } from "#src/file/ui/upload_file/demoUploadAreaStateCreate.ts"
import { UploadAreaFile } from "#src/file/ui/upload_file/UploadAreaFile.tsx"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"

export function DemoUploadArea() {
  const state = demoUploadAreaStateCreate()

  return (
    <PageWrapper>
      <h1 class="mb-4 text-lg font-semibold">File upload with image preview</h1>
      <div class="rounded-lg border border-slate-200 bg-card p-6 dark:border-slate-700">
        <UploadAreaFile hasUploaded={() => false} info={state.info} handler={state.handleInput} />
      </div>
    </PageWrapper>
  )
}
