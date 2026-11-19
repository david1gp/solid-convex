import * as a from "valibot"
import { createResult, createResultError, type Result } from "#result"
import type { ResourceModel } from "#src/resource/model/ResourceModel.ts"
import { cachePrefix } from "#src/utils/ui/cachePrefix.ts"
import { createSignalObject, type SignalObject } from "#ui/utils/createSignalObject.ts"

const resourceNameLocalStorageKey = cachePrefix + "resourceNameRecord"
const resourceNameRecordSchema = a.record(a.string(), a.string())

export const resourceNameRecordSignal: SignalObject<Record<string, string>> = createResourceNameRecordSignal()

function createResourceNameRecordSignal(): SignalObject<Record<string, string>> {
  let hasLoaded = false
  const signal = createSignalObject<Record<string, string>>({})

  // Override get to from localStorage if not already loaded
  const signalGet = signal.get
  signal.get = () => {
    if (!hasLoaded) {
      const result = resourceNameLoadFromLocalStorage()
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
    resourceNameSaveToLocalStorage(value)
    return result
  }

  return signal
}

export function resourceNameSet(resourceId: string, resourceName: string): Record<string, string> {
  const currentRecord = resourceNameRecordSignal.get()
  const oldValue = currentRecord[resourceId]

  // Only save if the value has actually changed
  if (oldValue === resourceName) {
    return currentRecord
  }

  const newRecord = { ...currentRecord, [resourceId]: resourceName }
  resourceNameRecordSignal.set(newRecord)
  return newRecord
}

export function resourceNameGet(resourceId: string): string | undefined {
  const record = resourceNameRecordSignal.get()
  return record[resourceId]
}

export function resourceNameAddList(resources: ResourceModel[]): Record<string, string> {
  const currentRecord = resourceNameRecordSignal.get()
  const updatedRecord = { ...currentRecord }
  let hasChanges = false

  for (const resource of resources) {
    if (resource.name && resource.resourceId) {
      const oldValue = updatedRecord[resource.resourceId]
      if (oldValue !== resource.name) {
        updatedRecord[resource.resourceId] = resource.name
        hasChanges = true
      }
    }
  }

  if (hasChanges) {
    resourceNameRecordSignal.set(updatedRecord)
  }

  return updatedRecord
}

export function resourceNameLoadFromLocalStorage(
  read = localStorage.getItem(resourceNameLocalStorageKey),
): Result<Record<string, string>> {
  const op = "resourceNameLoadFromLocalStorage"
  if (!read) return createResultError(op, "no resourceNameRecord saved in localStorage")

  const schema = a.pipe(a.string(), a.parseJson(), resourceNameRecordSchema)
  const parsing = a.safeParse(schema, read)

  if (!parsing.success) {
    return createResultError(op, a.summarize(parsing.issues), read)
  }

  return createResult(parsing.output as Record<string, string>)
}

export function resourceNameSaveToLocalStorage(record: Record<string, string>) {
  const serialized = JSON.stringify(record, null, 2)
  localStorage.setItem(resourceNameLocalStorageKey, serialized)
}

import { onCleanup, onSettled } from "solid-js"

export function resourceNameRecordSignalRegisterHandler(signal = resourceNameRecordSignal) {
  function handleStorageEvent(event: StorageEvent) {
    if (event.key !== resourceNameLocalStorageKey) return
    if (event.newValue == null) return
    const parsingResult = resourceNameLoadFromLocalStorage(event.newValue)
    if (!parsingResult.success) return
    signal.set(parsingResult.data)
  }
  onSettled(() => {
    if (typeof window === "undefined") return
    window.addEventListener("storage", handleStorageEvent)
  })
  onCleanup(() => {
    if (typeof window === "undefined") return
    window.removeEventListener("storage", handleStorageEvent)
  })
}
