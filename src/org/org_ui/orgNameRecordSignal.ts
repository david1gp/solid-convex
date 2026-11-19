import * as a from "valibot"
import { createResult, createResultError, type Result } from "#result"
import type { OrgModel } from "#src/org/org_model/OrgModel.ts"
import { cachePrefix } from "#src/utils/ui/cachePrefix.ts"
import { createSignalObject, type SignalObject } from "#ui/utils/createSignalObject.ts"

const orgNameLocalStorageKey = cachePrefix + "orgNameRecord"
const orgNameRecordSchema = a.record(a.string(), a.string())

export const orgNameRecordSignal: SignalObject<Record<string, string>> = createOrgNameRecordSignal()

function createOrgNameRecordSignal(): SignalObject<Record<string, string>> {
  let hasLoaded = false
  const signal = createSignalObject<Record<string, string>>({})

  // Override get to from localStorage if not already loaded
  const signalGet = signal.get
  signal.get = () => {
    if (!hasLoaded) {
      const result = orgNameLoadFromLocalStorage()
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
    orgNameSaveToLocalStorage(value)
    return result
  }

  return signal
}

export function orgNameSet(orgHandle: string, orgName: string): Record<string, string> {
  const currentRecord = orgNameRecordSignal.get()
  const oldValue = currentRecord[orgHandle]

  // Only save if the value has actually changed
  if (oldValue === orgName) {
    return currentRecord
  }

  const newRecord = { ...currentRecord, [orgHandle]: orgName }
  orgNameRecordSignal.set(newRecord)
  return newRecord
}

export function orgNameGet(orgHandle: string): string | undefined {
  const record = orgNameRecordSignal.get()
  return record[orgHandle]
}

export function orgNameAddList(orgs: OrgModel[]): Record<string, string> {
  const currentRecord = orgNameRecordSignal.get()
  const updatedRecord = { ...currentRecord }
  let hasChanges = false

  for (const org of orgs) {
    if (org.name && org.orgHandle) {
      const oldValue = updatedRecord[org.orgHandle]
      if (oldValue !== org.name) {
        updatedRecord[org.orgHandle] = org.name
        hasChanges = true
      }
    }
  }

  if (hasChanges) {
    orgNameRecordSignal.set(updatedRecord)
  }

  return updatedRecord
}

export function orgNameLoadFromLocalStorage(
  read = localStorage.getItem(orgNameLocalStorageKey),
): Result<Record<string, string>> {
  const op = "orgNameLoadFromLocalStorage"
  if (!read) return createResultError(op, "no orgNameRecord saved in localStorage")

  const schema = a.pipe(a.string(), a.parseJson(), orgNameRecordSchema)
  const parsing = a.safeParse(schema, read)

  if (!parsing.success) {
    return createResultError(op, a.summarize(parsing.issues), read)
  }

  return createResult(parsing.output as Record<string, string>)
}

export function orgNameSaveToLocalStorage(record: Record<string, string>) {
  const serialized = JSON.stringify(record, null, 2)
  localStorage.setItem(orgNameLocalStorageKey, serialized)
}

import { onCleanup, onSettled as onMount } from "solid-js"

export function orgNameRecordSignalRegisterHandler(signal = orgNameRecordSignal) {
  function handleStorageEvent(event: StorageEvent) {
    if (event.key !== orgNameLocalStorageKey) return
    if (event.newValue == null) return
    const parsingResult = orgNameLoadFromLocalStorage(event.newValue)
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
