import * as a from "valibot"
import { createResult, createResultError, type Result } from "#result"
import type { FileModel } from "#src/file/model/FileModel.ts"
import { cachePrefix } from "#src/utils/ui/cachePrefix.ts"
import { createSignalObject, type SignalObject } from "#ui/utils/createSignalObject.ts"

const fileNameLocalStorageKey = cachePrefix + "fileNameRecord"
const fileNameRecordSchema = a.record(a.string(), a.string())

export const fileNameRecordSignal: SignalObject<Record<string, string>> = createFileNameRecordSignal()

function createFileNameRecordSignal(): SignalObject<Record<string, string>> {
  let hasLoaded = false
  const signal = createSignalObject<Record<string, string>>({})

  // Override get to from localStorage if not already loaded
  const signalGet = signal.get
  signal.get = () => {
    if (!hasLoaded) {
      const result = fileNameLoadFromLocalStorage()
      if (result.success) {
        signal.set(result.data)
      }
      hasLoaded = true
    }
    return signalGet()
  }

  // Override the set method to also save to localStorage
  const signalSet = signal.set
  signal.set = (value) => {
    const result = signalSet(value)
    fileNameSaveToLocalStorage(value)
    return result
  }

  return signal
}

export function fileNameSet(fileId: string, fileName: string): Record<string, string> {
  const currentRecord = fileNameRecordSignal.get()
  const oldValue = currentRecord[fileId]

  // Only save if the value has actually changed
  if (oldValue === fileName) {
    return currentRecord
  }

  const newRecord = { ...currentRecord, [fileId]: fileName }
  fileNameRecordSignal.set(newRecord)
  return newRecord
}

export function fileNameGet(fileId: string): string | undefined {
  const record = fileNameRecordSignal.get()
  return record[fileId]
}

export function fileNameAddList(files: FileModel[]): Record<string, string> {
  const currentRecord = fileNameRecordSignal.get()
  const updatedRecord = { ...currentRecord }
  let hasChanges = false

  for (const file of files) {
    if (file.displayName && file.fileId) {
      const oldValue = updatedRecord[file.fileId]
      if (oldValue !== file.displayName) {
        updatedRecord[file.fileId] = file.displayName
        hasChanges = true
      }
    }
  }

  if (hasChanges) {
    fileNameRecordSignal.set(updatedRecord)
  }

  return updatedRecord
}

export function fileNameLoadFromLocalStorage(
  read = localStorage.getItem(fileNameLocalStorageKey),
): Result<Record<string, string>> {
  const op = "fileNameLoadFromLocalStorage"
  if (!read) return createResultError(op, "no fileNameRecord saved in localStorage")

  const schema = a.pipe(a.string(), a.parseJson(), fileNameRecordSchema)
  const parsing = a.safeParse(schema, read)

  if (!parsing.success) {
    return createResultError(op, a.summarize(parsing.issues), read)
  }

  return createResult(parsing.output as Record<string, string>)
}

export function fileNameSaveToLocalStorage(record: Record<string, string>) {
  const serialized = JSON.stringify(record, null, 2)
  localStorage.setItem(fileNameLocalStorageKey, serialized)
}

import { onCleanup, onMount } from "solid-js"

export function fileNameRecordSignalRegisterHandler(signal = fileNameRecordSignal) {
  function handleStorageEvent(event: StorageEvent) {
    if (event.key !== fileNameLocalStorageKey) return
    if (event.newValue == null) return
    const parsingResult = fileNameLoadFromLocalStorage(event.newValue)
    if (!parsingResult.success) return
    signal.set(parsingResult.data)
  }
  onMount(() => {
    if (typeof window === "undefined") return
    window.addEventListener("storage", handleStorageEvent)
  })
  onCleanup(() => {
    if (typeof window === "undefined") return
    window.removeEventListener("storage", handleStorageEvent)
  })
}
