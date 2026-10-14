import { debounce } from "@solid-primitives/scheduled"
import { onCleanup } from "solid-js"
import { createResult, createResultError } from "#result"

export function projectStorageWriterCreate() {
  let idle: number | undefined
  const write = (key: string, data: unknown) => {
    const op = "projectStorageWriterCreate"
    try {
      if (data === undefined) localStorage.removeItem(key)
      else localStorage.setItem(key, JSON.stringify(data))
      return createResult(null)
    } catch (error) {
      return createResultError(op, "Unable to save local data", String(error))
    }
  }
  const save = debounce((key: string, data: unknown) => {
    if (idle !== undefined && typeof cancelIdleCallback === "function") cancelIdleCallback(idle)
    if (typeof requestIdleCallback === "function") idle = requestIdleCallback(() => write(key, data))
    else write(key, data)
  }, 300)
  onCleanup(() => {
    save.clear()
    if (idle !== undefined && typeof cancelIdleCallback === "function") cancelIdleCallback(idle)
  })
  return {
    save,
    clear: (key: string) => {
      save.clear()
      if (idle !== undefined && typeof cancelIdleCallback === "function") cancelIdleCallback(idle)
      return write(key, undefined)
    },
  }
}
