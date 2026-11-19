import { Show } from "solid-js"
import { inputMaxLength500 } from "#src/utils/valibot/inputMaxLength500.ts"
import { inputMaxLengthDefault } from "#src/utils/valibot/inputMaxLengthDefault.ts"
import { type FormMode, formMode, formModeIsReadOnly } from "#ui/input/form/formMode.ts"
import { Input } from "#ui/input/input/Input.jsx"
import { Label } from "#ui/input/label/Label.jsx"
import { LabelAsterix } from "#ui/input/label/LabelAsterix.jsx"
import { Textarea } from "#ui/input/textarea/Textarea.jsx"
import { cn } from "cn"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"
import type { FormFieldConfig } from "./formFieldConfigs.js"

export interface FormFieldInputProps extends MayHaveClass {
  // Field configuration
  config: FormFieldConfig

  // Form state management
  value: string
  error: string
  mode: FormMode

  // Additional props
  disabled?: boolean

  // Event handlers
  onInput: (value: string) => void
  onBlur: (value: string) => void
}

export function FormFieldInput(p: FormFieldInputProps) {
  const maxLength = p.config.maxLength ?? inputMaxLengthDefault
  const isTextarea = maxLength > inputMaxLengthDefault && p.config.type !== "url"
  const Component = isTextarea ? Textarea : Input
  const isTextareaLong = maxLength > inputMaxLength500

  return (
    <div class={cn("flex flex-col gap-2", p.class)}>
      <Label for={p.config.name} class={p.config.labelClass}>
        {p.config.label()}
        {p.config.required && <LabelAsterix />}
      </Label>
      <Show when={p.config.subtitle}>
        <p class={cn("text-muted-foreground", p.config.subtitleClass)}>{p.config.subtitle}</p>
      </Show>
      <Component
        id={p.config.name}
        type={p.config.type}
        placeholder={p.config.placeholder()}
        autocomplete={p.config.autocomplete || "off"}
        value={p.value}
        onInput={(e: InputEvent | Event) => {
          const value = (e.currentTarget as HTMLInputElement | HTMLTextAreaElement).value
          p.onInput(value)
        }}
        onBlur={(e: FocusEvent) => p.onBlur((e.currentTarget as HTMLInputElement | HTMLTextAreaElement).value)}
        class={cn(
          "w-full",
          p.config.type === "date" && "w-[18ch]",
          isTextarea && (isTextareaLong ? "min-h-[10lh]" : "min-h-[3lh]"),
          p.error && "border-destructive focus-visible:ring-destructive",
          p.config.class,
        )}
        maxlength={p.config.maxLength ?? inputMaxLengthDefault}
        disabled={p.disabled || p.mode === formMode.remove}
        readonly={formModeIsReadOnly(p.mode)}
      />
      <Show when={p.error}>
        <p class="text-destructive">{p.error}</p>
      </Show>
    </div>
  )
}
