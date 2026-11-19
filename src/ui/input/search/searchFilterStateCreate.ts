import { debounce, type Scheduled } from "@solid-primitives/scheduled"
import { type Accessor, createSignal, onCleanup } from "solid-js"
import { isServer } from "@solidjs/web"
import * as v from "valibot"
import { debounceMs as defaultDebounceMs } from "#src/utils/ui/debounceMs.ts"
import { createSignalObject, type SignalObject } from "#ui/utils/createSignalObject.ts"

const searchValueSchema = v.pipe(v.string(), v.maxLength(500, "Only a max length of 500 is allowed"))

function searchValueFromUrl(raw: string | null): string {
  if (raw === null) return ""
  const parsed = v.safeParse(searchValueSchema, raw)
  return parsed.success ? parsed.output : ""
}

function filterValueFromUrl(raw: string | null, fallback: string): string {
  if (raw === null) return fallback
  const parsed = v.safeParse(searchValueSchema, raw)
  return parsed.success ? parsed.output : fallback
}

function idleSchedule(callback: () => void): void {
  if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(() => callback())
  } else if (typeof window !== "undefined") {
    setTimeout(callback, 0)
  } else {
    callback()
  }
}

export function searchFilterStateCreate<T extends Record<string, string>>(
  defaultFilters: T,
  options: {
    searchKey?: string
    debounceMs?: number
  } = {},
): {
  searchSignal: SignalObject<string>
  filterSignal: {
    get: Accessor<T>
    set: (value: T) => void
    update: (updates: Partial<T>) => void
    clear: () => void
    hasActiveFilters: () => boolean
  }
  debouncedSearch: Accessor<string>
  debouncedFilters: Accessor<T>
  flush: Scheduled<[]>
} {
  const searchKey = options.searchKey ?? "search"
  const wait = options.debounceMs ?? defaultDebounceMs
  const search = createSignalObject("")
  const filters = createSignalObject(defaultFilters)
  const [debouncedSearch, setDebouncedSearch] = createSignal("")
  const [debouncedFilters, setDebouncedFilters] = createSignal(defaultFilters)
  let isApplyingUrl = false

  const flush = searchFilterDebounceCreate(() => {
    setDebouncedSearch(search.get())
    setDebouncedFilters(() => ({ ...filters.get() }))
    if (typeof window === "undefined") return
    const nextSearch = search.get()
    const nextFilters = { ...filters.get() }
    idleSchedule(() => {
      const currentUrl = new URL(window.location.href)
      currentUrl.searchParams.delete(searchKey)
      if (nextSearch) currentUrl.searchParams.set(searchKey, nextSearch)
      for (const [key, value] of Object.entries(nextFilters)) {
        currentUrl.searchParams.delete(key)
        if (value !== defaultFilters[key as keyof T] && value) currentUrl.searchParams.set(key, value)
      }
      window.history.replaceState(null, "", currentUrl.href)
    })
  }, wait)

  if (typeof window !== "undefined") {
    applyUrl(new URL(window.location.href))
    window.addEventListener("popstate", handlePopState)
  }

  onCleanup(() => {
    flush.clear()
    if (typeof window !== "undefined") window.removeEventListener("popstate", handlePopState)
  })

  function handlePopState() {
    flush.clear()
    applyUrl(new URL(window.location.href))
  }

  function applyUrl(nextUrl: URL) {
    isApplyingUrl = true
    const nextSearch = searchValueFromUrl(nextUrl.searchParams.get(searchKey))
    const nextFilters = { ...defaultFilters }
    for (const key of Object.keys(defaultFilters)) {
      const fallback = defaultFilters[key as keyof T]
      nextFilters[key as keyof T] = filterValueFromUrl(nextUrl.searchParams.get(key), fallback as string) as T[keyof T]
    }
    search.set(nextSearch)
    filters.set(nextFilters)
    setDebouncedSearch(nextSearch)
    setDebouncedFilters(() => nextFilters)
    isApplyingUrl = false
  }

  function schedule() {
    if (isApplyingUrl) return
    flush()
  }

  const searchSignal: SignalObject<string> = {
    get: search.get,
    set: (value) => {
      search.set(value)
      schedule()
    },
  }
  const filterSignal = {
    get: filters.get,
    set: (value: T) => {
      filters.set(value)
      schedule()
    },
    update: (updates: Partial<T>) => {
      filters.set({ ...filters.get(), ...updates })
      schedule()
    },
    clear: () => {
      filters.set({ ...defaultFilters })
      schedule()
    },
    hasActiveFilters: () =>
      Object.entries(filters.get()).some(([key, value]) => value !== defaultFilters[key as keyof T]),
  }

  return {
    searchSignal,
    filterSignal,
    debouncedSearch,
    debouncedFilters,
    flush,
  }
}

function searchFilterDebounceCreate(callback: () => void, wait: number): Scheduled<[]> {
  if (!isServer) return debounce(callback, wait)
  let timeout: ReturnType<typeof setTimeout> | undefined
  const scheduled = (() => {
    if (timeout !== undefined) clearTimeout(timeout)
    timeout = setTimeout(callback, wait)
  }) as Scheduled<[]>
  scheduled.clear = () => {
    if (timeout !== undefined) clearTimeout(timeout)
  }
  return scheduled
}
