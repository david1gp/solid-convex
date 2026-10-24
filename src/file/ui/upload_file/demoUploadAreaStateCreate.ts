import { fileInformationGet } from "#src/file/ui/stats/fileInformationGet.ts"
import type { UploadAreaFileInfo } from "#src/file/ui/stats/UploadAreaFileInfo.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

export function demoUploadAreaStateCreate() {
  const info = createSignalObject<UploadAreaFileInfo | null>(null)

  function handleInput(e: Event) {
    const files = (e.currentTarget as HTMLInputElement | null)?.files
    if (files?.[0]) {
      fileInformationGet(files[0], info)
    }
  }

  return { info, handleInput }
}
