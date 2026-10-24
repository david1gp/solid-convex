import { debounce } from "@solid-primitives/scheduled"
import { onCleanup, onMount } from "solid-js"
import * as v from "valibot"
import { ttc } from "#src/app/i18n/ttc.ts"
import type { SearchInputProps } from "#src/ui/input/search/SearchInputProps.ts"
import { debounceMs } from "#src/utils/ui/debounceMs.ts"
import { generateId12 } from "#utils/ran/generateId12.js"

const searchKey = "search"

const searchInputValueSchema = v.pipe(v.string(), v.maxLength(500, "Only a max length of 500 is allowed"))

function searchIdleSchedule(callback: () => void): void {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(() => callback())
  } else {
    setTimeout(callback, 0)
  }
}

export function searchInputStateCreate(props: () => SearchInputProps) {
  const generatedId = generateId12()

  function loadSearchFromUrl() {
    const currentUrl = new URL(window.location.href)
    const raw = currentUrl.searchParams.get(searchKey)
    if (raw === null) {
      props().searchSignal.set("")
      return
    }
    const parsed = v.safeParse(searchInputValueSchema, raw)
    props().searchSignal.set(parsed.success ? parsed.output : "")
  }

  const debouncedSearch = debounce(() => {
    if (props().searchState) return
    const search = props().searchSignal.get()
    searchIdleSchedule(() => {
      const currentUrl = new URL(window.location.href)
      if (search) {
        currentUrl.searchParams.set(searchKey, search)
      } else {
        currentUrl.searchParams.delete(searchKey)
      }
      window.history.replaceState(null, "", currentUrl.href)
    })
  }, props().debounceMs ?? debounceMs)

  onMount(() => {
    if (props().searchState) return
    loadSearchFromUrl()
    window.addEventListener("popstate", loadSearchFromUrl)
  })

  onCleanup(() => {
    debouncedSearch.clear()
    if (!props().searchState && typeof window !== "undefined") window.removeEventListener("popstate", loadSearchFromUrl)
  })

  function handleInput(e: InputEvent) {
    const target = e.currentTarget as HTMLInputElement
    props().searchSignal.set(target.value)
    if (!props().searchState) debouncedSearch()
  }

  return {
    handleInput,
    hasSearch: () => props().searchSignal.get().length > 0,
    id: () => props().id ?? generatedId,
    placeholder: () => props().placeholder ?? ttc("Search..."),
    searchValue: props().searchSignal.get,
  }
}
