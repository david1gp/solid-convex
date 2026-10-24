import { createEffect } from "solid-js"
import { fileNameSet } from "#src/file/ui/fileNameRecordSignal.ts"
import type { FileComponentProps } from "#src/file/ui/mutate/FileLoader.tsx"

export function fileMutateStateCreate(p: { file: () => FileComponentProps["file"] }) {
  createEffect(() => {
    const file = p.file()
    if (!file) return
    fileNameSet(file.fileId, file.displayName)
  })

  return {}
}
