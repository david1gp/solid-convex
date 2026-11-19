import { onCleanup, onSettled as onMount } from "solid-js"
import * as a from "valibot"
import { createResult, createResultError, type Result } from "#result"
import { createSignalObject, type SignalObject } from "#ui/utils/createSignalObject.ts"

const inDevModeLocalStorageKey = "inDevMode"

export const inDevModeSignal: SignalObject<boolean> = createInDevModeSignal()

function createInDevModeSignal(): SignalObject<boolean> {
  let hasLoaded = false
  const signal = createSignalObject<boolean>(false)

  const signalGet = signal.get
  signal.get = () => {
    if (!hasLoaded) {
      const result = inDevModeLoadFromLocalStorage()
      if (result.success) {
        signal.set(result.data)
      }
      hasLoaded = true
    }
    return signalGet()
  }

  const signalSet = signal.set
  signal.set = (value) => {
    signalSet(value)
    inDevModeSaveToLocalStorage(value)
    return value
  }

  return signal
}

export function inDevModeLoadFromLocalStorage(): Result<boolean> {
  const op = "inDevModeLoadFromLocalStorage"
  if (typeof localStorage === "undefined") return createResultError(op, "localStorage not defined")
  const read = localStorage.getItem(inDevModeLocalStorageKey)
  if (!read) return createResultError(op, "no inDevMode saved in localStorage")
  const schema = a.pipe(a.string(), a.parseJson(), a.boolean())
  const parsing = a.safeParse(schema, read)
  if (!parsing.success) {
    return createResultError(op, a.summarize(parsing.issues), read)
  }
  return createResult(parsing.output)
}

export function inDevModeSaveToLocalStorage(value: boolean) {
  if (typeof localStorage === "undefined") return
  localStorage.setItem(inDevModeLocalStorageKey, JSON.stringify(value))
}

export function onDevModeSignalRegisterHandler(signal = inDevModeSignal) {
  function handleStorageEvent(event: StorageEvent) {
    if (event.key !== inDevModeLocalStorageKey) return
    if (event.newValue === null) return
    const parsing = a.safeParse(a.boolean(), event.newValue)
    if (parsing.success) {
      signal.set(parsing.output)
    }
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
