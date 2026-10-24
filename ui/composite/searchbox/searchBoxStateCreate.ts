import { createSignal, onCleanup } from "solid-js"
import type { SearchFilterEntry } from "#ui/composite/searchbox/SearchBox.jsx"

export function searchBoxStateCreate(p: { filters: () => SearchFilterEntry[] }) {
  const [activeFilterKey, setActiveFilterKey] = createSignal<string | null>(null)

  let containerRef: HTMLDivElement | undefined

  function setContainerRef(el: HTMLDivElement | undefined) {
    containerRef = el
  }

  function handleClickOutside(event: MouseEvent) {
    if (containerRef && !containerRef.contains(event.target as Node)) {
      setActiveFilterKey(null)
    }
  }

  document.addEventListener("mousedown", handleClickOutside)
  onCleanup(() => document.removeEventListener("mousedown", handleClickOutside))

  function handleFilterClick(key: string) {
    if (activeFilterKey() === key) {
      setActiveFilterKey(null)
    } else {
      setActiveFilterKey(key)
    }
  }

  function handleOptionSelect(filter: SearchFilterEntry, value: string) {
    filter.valueSignal.set(value)
    setActiveFilterKey(null)
  }

  function handleClear() {
    clearAllFilters(p.filters())
    setActiveFilterKey(null)
  }

  function activeFilter() {
    return p.filters().find((f) => f.key === activeFilterKey())
  }

  function filtersActive() {
    return hasActiveFilters(p.filters())
  }

  function buttonActive(filter: SearchFilterEntry) {
    return isButtonActive(filter)
  }

  function buttonText(filter: SearchFilterEntry) {
    return getButtonText(filter)
  }

  function optionText(entry: SearchFilterEntry, value: string) {
    return getOptionText(entry, value)
  }

  return {
    activeFilterKey,
    setContainerRef,
    handleFilterClick,
    handleOptionSelect,
    handleClear,
    activeFilter,
    filtersActive,
    buttonActive,
    buttonText,
    optionText,
  }
}

function getOptionText(entry: SearchFilterEntry, value: string): string {
  if (!value) return ""
  if (entry.getOptionText) return entry.getOptionText(value)
  return value
}

function hasActiveFilters(filters: SearchFilterEntry[]): boolean {
  return filters.some((f) => f.valueSignal.get() !== "")
}

function clearAllFilters(filters: SearchFilterEntry[]) {
  filters.forEach((f) => {
    f.valueSignal.set("")
  })
}

function isButtonActive(filter: SearchFilterEntry): boolean {
  return filter.valueSignal.get() !== ""
}

function getButtonText(filter: SearchFilterEntry): string {
  const value = filter.valueSignal.get()
  if (!value) return filter.label
  return getOptionText(filter, value)
}
