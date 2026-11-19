import { createEffect } from "solid-js"
import { fileNameSet } from "#src/file/ui/fileNameRecordSignal.ts"
import type { FileComponentProps } from "#src/file/ui/mutate/FileLoader.tsx"

export function fileMutateStateCreate(p: { file: () => FileComponentProps["file"] }) {
  createEffect(
    () => p.file(),
    (file) => {
      if (!file) return
      fileNameSet(file.fileId, file.displayName)
    },
  )

  return {}
}
