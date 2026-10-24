import { createSignal } from "solid-js"
import type { SearchFilterEntry } from "#ui/composite/searchbox/SearchBox.jsx"

export function filterDropdownStateCreate(p: {
  filter: () => SearchFilterEntry
  optionText: (entry: SearchFilterEntry, value: string) => string
}) {
  const [filterQuery, setFilterQuery] = createSignal("")

  function filteredOptions() {
    return filterOptions(p.filter().getOptions(), filterQuery())
  }

  function isSelected(option: string) {
    return p.filter().valueSignal.get() === option
  }

  function handleQueryInput(value: string) {
    setFilterQuery(value)
  }

  function displayText(value: string) {
    return p.optionText(p.filter(), value)
  }

  return { filterQuery, handleQueryInput, filteredOptions, isSelected, displayText }
}

function filterOptions(options: string[], query: string): string[] {
  if (!query.trim()) return options
  const lowerQuery = query.toLowerCase()
  return options.filter((opt) => opt.toLowerCase().includes(lowerQuery))
}
