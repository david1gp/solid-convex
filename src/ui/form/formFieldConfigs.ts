import type { BaseSchema } from "valibot"
import { ttc } from "#src/app/i18n/ttc.ts"
import { inputMaxLengthDescription } from "#src/utils/valibot/inputMaxLengthDescription.ts"
import { inputMaxLengthUrl } from "#src/utils/valibot/inputMaxLengthUrl.ts"

// Pre-configured field types for common use cases

export interface FormFieldConfig {
  name: string
  label: () => string
  labelClass?: string
  placeholder: () => string
  subtitle?: string
  subtitleClass?: string
  required?: boolean
  type?: "text" | "password" | "url" | "date" | "datetime-local"
  maxLength?: number
  autocomplete?: string
  class?: string
  disabled?: boolean

  schema?: BaseSchema<any, any, any>
}

export const formFieldConfigs = {
  name: {
    name: "name",
    label: () => ttc("Name"),
    placeholder: () => ttc("Enter name"),
  } as const satisfies FormFieldConfig,

  description: {
    name: "description",
    label: () => ttc("Description"),
    placeholder: () => ttc("Enter description"),
    maxLength: inputMaxLengthDescription,
  } as const satisfies FormFieldConfig,

  url: {
    name: "url",
    label: () => ttc("URL"),
    placeholder: () => ttc("Enter URL"),
    type: "url",
    maxLength: inputMaxLengthUrl,
    autocomplete: "url",
  } as const satisfies FormFieldConfig,

  image: {
    name: "image",
    label: () => ttc("Or paste image link (URL) here"),
    placeholder: () =>
      ttc("Use this only if your image is already online somewhere, e.g., on Google Drive, Imgur, Dropbox, etc."),
    type: "url",
    maxLength: inputMaxLengthUrl,
    autocomplete: "url",
  } as const satisfies FormFieldConfig,

  date: {
    name: "date",
    label: () => ttc("Date"),
    placeholder: () => ttc("Enter date and time"),
    required: true,
    type: "datetime-local",
  } as const satisfies FormFieldConfig,

  email: {
    name: "email",
    label: () => ttc("Email"),
    placeholder: () => ttc("Enter email address"),
    autocomplete: "email",
  } as const satisfies FormFieldConfig,
} satisfies Record<string, FormFieldConfig>
