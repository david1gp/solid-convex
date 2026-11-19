import { mdiClose } from "@adaptive-ds/mdi/mdiClose.js"
import { For } from "solid-js"
import type { FilterFieldConfig } from "#src/ui/input/search/FilterFieldConfig.ts"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"
import { dateFormatFull } from "#utils/date/dateFormat.js"

export function SearchFilterButtons<T extends Record<string, string>>(p: FilterButtonProps<T>) {
  function handleFilterRemove(fieldKey: string) {
    const defaultValue = "" as T[string]
    p.filterSignal.update({ [fieldKey]: defaultValue } as Partial<T>)
  }

  function getActiveFilters() {
    const current = p.filterSignal.get()
    return Object.entries(current).filter(([_, value]) => Boolean(value))
  }

  const activeFilters = () => getActiveFilters()

  return (
    <For each={activeFilters()}>
      {([fieldKey, value]) => {
        const fieldConfig = p.filterFields[fieldKey]
        if (!fieldConfig || !value) return null
        return FilterButton(fieldKey, value, fieldConfig, handleFilterRemove)
      }}
    </For>
  )
}

export interface FilterButtonProps<T extends Record<string, string>> extends MayHaveClass {
  filterSignal: {
    get: () => T
    update: (updates: Partial<T>) => void
  }
  filterFields: Record<string, FilterFieldConfig>
}

function FilterButton(
  fieldKey: string,
  value: string,
  fieldConfig: FilterFieldConfig,
  onRemove: (fieldKey: string) => void,
) {
  if (fieldConfig.isDateFilter) {
    return DateFilterButton(fieldKey, value, fieldConfig, onRemove)
  }

  const optionLabel = () => fieldConfig.optionLabels(value)
  const removeTitle = () => `Remove filter (${fieldConfig.label()}): ${optionLabel()}`
  return (
    <ButtonIcon
      onClick={() => onRemove(fieldKey)}
      title={removeTitle()}
      variant={buttonVariant.filled}
      iconRight={mdiClose}
      iconClass="ml-0"
      class="bg-gray-50 border border-input gap-2"
    >
      <span class="font-medium">{fieldConfig.label()}:</span>
      <span>{optionLabel()}</span>
    </ButtonIcon>
  )
}

function DateFilterButton(
  fieldKey: string,
  value: string,
  fieldConfig: FilterFieldConfig,
  onRemove: (fieldKey: string) => void,
) {
  const removeTitle = () => `Remove ${fieldConfig.label()} filter`
  return (
    <ButtonIcon
      onClick={() => onRemove(fieldKey)}
      title={removeTitle()}
      variant={buttonVariant.filled}
      iconRight={mdiClose}
      class="bg-gray-50 border border-input gap-2"
    >
      <span class="font-medium">{fieldConfig.label()}:</span>
      <span>{dateFormatFull(value)}</span>
    </ButtonIcon>
  )
}
