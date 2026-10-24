import { ttc } from "#src/app/i18n/ttc.ts"
import type { FormFieldConfig } from "#src/ui/form/formFieldConfigs.ts"
import { formFieldConfigs } from "#src/ui/form/formFieldConfigs.ts"
import { inputMaxLength500 } from "#src/utils/valibot/inputMaxLength500.ts"
import { inputMaxLengthUrl } from "#src/utils/valibot/inputMaxLengthUrl.ts"

export type UserProfileFormField = keyof typeof userProfileFormField

export const userProfileFormField = {
  // id
  userId: "userId",
  // data
  name: "name",
  username: "username",
  image: "image",
  email: "email",
  bio: "bio",
  url: "url",
  role: "role",
  orgHandle: "orgHandle",
  orgRole: "orgRole",
  createdAt: "createdAt",
} as const

export const userProfileFormConfig = {
  userId: {
    name: "userId",
    label: () => ttc("User ID"),
    placeholder: () => ttc("User ID"),
  } as const satisfies FormFieldConfig,

  name: {
    ...formFieldConfigs.name,
    placeholder: () => ttc("Enter your name"),
  } as const satisfies FormFieldConfig,

  username: {
    name: "username",
    label: () => ttc("Username"),
    placeholder: () => ttc("Enter username"),
    autocomplete: "username",
  } as const satisfies FormFieldConfig,

  image: {
    ...formFieldConfigs.image,
    placeholder: () => ttc("Profile image URL"),
  } as const satisfies FormFieldConfig,

  email: {
    name: "email",
    label: () => ttc("Email"),
    placeholder: () => ttc("Enter email address"),
    autocomplete: "email",
  } as const satisfies FormFieldConfig,

  bio: {
    name: "bio",
    label: () => ttc("Bio"),
    placeholder: () => ttc("Tell us about yourself"),
    maxLength: inputMaxLength500,
  } as const satisfies FormFieldConfig,

  url: {
    name: "url",
    label: () => ttc("Website"),
    placeholder: () => ttc("Enter your website URL"),
    autocomplete: "url",
    maxLength: inputMaxLengthUrl,
  } as const satisfies FormFieldConfig,

  role: {
    name: "role",
    label: () => ttc("Role"),
    placeholder: () => ttc("Enter role"),
  } as const satisfies FormFieldConfig,

  orgHandle: {
    name: "orgHandle",
    label: () => ttc("Organization Handle"),
    placeholder: () => ttc("Enter organization handle"),
    autocomplete: "organization-name",
  } as const satisfies FormFieldConfig,

  orgRole: {
    name: "orgRole",
    label: () => ttc("Organization Role"),
    placeholder: () => ttc("Enter organization role"),
  } as const satisfies FormFieldConfig,

  createdAt: {
    name: "createdAt",
    label: () => ttc("Created At"),
    placeholder: () => ttc("Created At"),
  } as const satisfies FormFieldConfig,
} as const satisfies Record<UserProfileFormField, FormFieldConfig>
