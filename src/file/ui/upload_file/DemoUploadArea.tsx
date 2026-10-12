import { fileInformationGet } from "#src/file/ui/stats/fileInformationGet.ts"
import type { UploadAreaFileInfo } from "#src/file/ui/stats/UploadAreaFileInfo.ts"
import { UploadAreaFile } from "#src/file/ui/upload_file/UploadAreaFile.tsx"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

export function DemoUploadArea() {
  const info = createSignalObject<UploadAreaFileInfo | null>(null)

  return (
    <PageWrapper>
      <h1 class="mb-4 text-lg font-semibold">File upload with image preview</h1>
      <div class="rounded-lg border border-slate-200 bg-card p-6 dark:border-slate-700">
        <UploadAreaFile
          hasUploaded={() => false}
          info={info}
          handler={(e) => {
            const files = e.currentTarget.files
            if (files && files[0]) {
              fileInformationGet(files[0], info)
            }
          }}
        />
      </div>
    </PageWrapper>
  )
}
