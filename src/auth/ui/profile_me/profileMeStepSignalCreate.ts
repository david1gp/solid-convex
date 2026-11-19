import { debounce } from "@solid-primitives/scheduled"
import { onCleanup, onSettled as onMount } from "solid-js"
import * as a from "valibot"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

/** Each profile form keeps its current step in its own route's search parameters. */
export function profileMeStepSignalCreate() {
  const step = createSignalObject(1)
  let idle: number | undefined
  const urlWrite = debounce((pathname: string) => {
    const update = () => {
      if (window.location.pathname !== pathname) return
      const url = new URL(window.location.href)
      url.searchParams.set("step", String(step.get()))
      window.history.replaceState(window.history.state, "", url.href)
    }
    if (window.requestIdleCallback) {
      idle = window.requestIdleCallback(update, { timeout: 250 })
      return
    }
    update()
  }, 80)
  onCleanup(() => {
    urlWrite.clear()
    if (idle !== undefined) window.cancelIdleCallback(idle)
  })
  onMount(() => {
    const parsed = a.safeParse(a.picklist(["1", "2"]), new URL(window.location.href).searchParams.get("step"))
    if (parsed.success) step.set(Number(parsed.output))
  })
  function goTo(value: number) {
    step.set(value)
    if (typeof window === "undefined") return
    urlWrite(window.location.pathname)
  }
  return { get: step.get, goBack: () => goTo(1), goToConfirmation: () => goTo(2) }
}
