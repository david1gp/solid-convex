import { mdiClose } from "@adaptive-ds/mdi/mdiClose.js"
import { mdiFilterVariant } from "@adaptive-ds/mdi/mdiFilterVariant.js"
import { createUniqueId, For, Show } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import type { FilterFieldConfig } from "#src/ui/input/search/FilterFieldConfig.ts"
import { InputS } from "#ui/input/input/InputS.jsx"
import { SelectSingleNative } from "#ui/input/select/SelectSingleNative.jsx"
import { ButtonIconOnly } from "#ui/interactive/button/ButtonIconOnly.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { CorvuPopover } from "#ui/interactive/popover/CorvuPopover.jsx"
import { classArr } from "#ui/utils/classArr.ts"
import type { SignalObject } from "#ui/utils/createSignalObject.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface SearchFilterProps<T extends Record<string, string>> extends MayHaveClass {
  filterSignal: {
    get: () => T
    update: (updates: Partial<T>) => void
  }
  filterFields: Record<string, FilterFieldConfig>
  title?: string
}

export function SearchFilterPopover<T extends Record<string, string>>(p: SearchFilterProps<T>) {
  const title = p.title || ttc("Add filter")

  function handleFilterSelect(fieldKey: string, value: string) {
    p.filterSignal.update({ [fieldKey]: value } as Partial<T>)
  }

  function handleFilterClear(fieldKey: string) {
    const defaultValue = "" as T[string]
    p.filterSignal.update({ [fieldKey]: defaultValue } as Partial<T>)
  }

  return (
    <CorvuPopover
      icon={mdiFilterVariant}
      variant={buttonVariant.filled}
      class={classArr("bg-gray-50", "border border-input", "rounded-lg", p.class)}
      title={title}
    >
      <h3 class="text-xl font-semibold mb-3">{title}</h3>
      <div class="space-y-2">
        <For each={Object.entries(p.filterFields)}>
          {([fieldKey, fieldConfig]) => {
            const currentValue = () => p.filterSignal.get()[fieldKey as keyof T]

            return FilterField(fieldKey, fieldConfig, currentValue, handleFilterSelect, handleFilterClear)
          }}
        </For>
      </div>
    </CorvuPopover>
  )
}

function FilterField(
  fieldKey: string,
  fieldConfig: FilterFieldConfig,
  currentValue: () => string,
  onSelect: (fieldKey: string, value: string) => void,
  onClear: (fieldKey: string) => void,
) {
  if (fieldConfig.isDateFilter) {
    return DateFilterField(fieldKey, fieldConfig, currentValue, onSelect, onClear)
  }

  const inputId = createUniqueId()
  const valueSignal: SignalObject<string> = {
    get: currentValue,
    set: (value: string) => onSelect(fieldKey, value),
  }
  const getOptions = () => {
    const options = Object.keys(fieldConfig.options)
    return ["", ...options] as string[]
  }
  const valueText = (value: string) => {
    if (!value) return ttc("All")
    return fieldConfig.optionLabels(value) || value
  }
  return (
    <>
      <div class="flex items-center justify-between">
        <label for={inputId} class="text-lg font-medium">
          {fieldConfig.label()}
        </label>
        <Show when={currentValue()}>
          <ButtonIconOnly
            variant={buttonVariant.ghost}
            icon={mdiClose}
            onClick={() => onClear(fieldKey)}
            title={ttc("Clear filter")}
          />
        </Show>
      </div>
      <SelectSingleNative
        id={inputId}
        valueSignal={valueSignal}
        getOptions={getOptions}
        valueText={valueText}
        class="py-1 rounded-none"
      />
    </>
  )
}

function DateFilterField(
  fieldKey: string,
  fieldConfig: FilterFieldConfig,
  currentValue: () => string,
  onSelect: (fieldKey: string, value: string) => void,
  onClear: (fieldKey: string) => void,
) {
  const inputId = createUniqueId()
  const valueSignal: SignalObject<string> = {
    get: currentValue,
    set: (value: string) => onSelect(fieldKey, value),
  }

  return (
    <>
      <div class="flex items-center justify-between">
        <label for={inputId} class="text-lg font-medium">
          {fieldConfig.label()}
        </label>
        <Show when={currentValue()}>
          <ButtonIconOnly
            variant={buttonVariant.ghost}
            icon={mdiClose}
            onClick={() => onClear(fieldKey)}
            title={ttc("Clear filter")}
          />
        </Show>
      </div>
      <InputS id={inputId} valueSignal={valueSignal} type="date" />
    </>
  )
}
