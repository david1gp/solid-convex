import { Show } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import type { UserRole } from "#src/auth/model_field/userRole.ts"
import { userProfileFormConfig, userProfileFormField } from "#src/auth/ui/profile/userProfileFormField.ts"
import { ProfileSectionImage } from "#src/auth/ui/profile_me/ProfileSectionImage.tsx"
import type { OrgRole } from "#src/org/org_model_field/orgRole.ts"
import { DateView } from "#src/ui/date/DateView.tsx"
import { FormFieldInput } from "#src/ui/form/FormFieldInput.tsx"
import type { FormMode } from "#ui/input/form/formMode.ts"
import { Label } from "#ui/input/label/Label.jsx"
import { classMerge } from "#ui/utils/classMerge.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"
import type { UserProfileFormStateManagement } from "./userProfileFormState.js"

interface HasUserProfileFormStateManagement {
  sm: UserProfileFormStateManagement
}

export interface UserProfileFormProps extends MayHaveClass, HasUserProfileFormStateManagement {
  mode: FormMode
}

export function UserProfileForm(p: UserProfileFormProps) {
  return (
    <section class={classMerge("px-2 sm:px-4 pb-10", "text-foreground", p.class)}>
      <ProfileSectionImage image={p.sm.state.image.get()} name={p.sm.state.name.get()} />
      {/* <h1 class="text-2xl font-bold mt-6 mb-2">{getUserProfileTitle(p.mode)}</h1> */}
      <form class="space-y-4">
        <UserIdField sm={p.sm} />
        <NameField sm={p.sm} />
        <UsernameField sm={p.sm} />
        <ImageField sm={p.sm} />
        <EmailField sm={p.sm} />
        <BioField sm={p.sm} />
        <UrlField sm={p.sm} />
        <RoleField sm={p.sm} />
        <OrgHandleField sm={p.sm} />
        <OrgRoleField sm={p.sm} />
        <CreatedAtField sm={p.sm} />
      </form>
    </section>
  )
}

function UserIdField(p: HasUserProfileFormStateManagement) {
  return (
    <FormFieldInput
      config={userProfileFormConfig.userId}
      value={p.sm.state.userId.get()}
      error={p.sm.errors.userId.get()}
      mode={p.sm.mode}
      onInput={(value) => {
        p.sm.state.userId.set(value)
      }}
      onBlur={(value) => {
        p.sm.state.userId.set(value)
      }}
    />
  )
}

function NameField(p: HasUserProfileFormStateManagement) {
  return (
    <FormFieldInput
      config={userProfileFormConfig.name}
      value={p.sm.state.name.get()}
      error={p.sm.errors.name.get()}
      mode={p.sm.mode}
      onInput={(value) => {
        p.sm.state.name.set(value)
      }}
      onBlur={(value) => {
        p.sm.state.name.set(value)
      }}
    />
  )
}

function UsernameField(p: HasUserProfileFormStateManagement) {
  return (
    <FormFieldInput
      config={userProfileFormConfig.username}
      value={p.sm.state.username.get()}
      error={p.sm.errors.username.get()}
      mode={p.sm.mode}
      onInput={(value) => {
        p.sm.state.username.set(value)
      }}
      onBlur={(value) => {
        p.sm.state.username.set(value)
      }}
    />
  )
}

function ImageField(p: HasUserProfileFormStateManagement) {
  return (
    <div class="flex flex-col gap-2">
      <FormFieldInput
        config={userProfileFormConfig.image}
        value={p.sm.state.image.get()}
        error={p.sm.errors.image.get()}
        mode={p.sm.mode}
        onInput={(value) => {
          p.sm.state.image.set(value)
        }}
        onBlur={(value) => {
          p.sm.state.image.set(value)
        }}
      />
      <Show when={p.sm.state.image.get()}>
        <img src={p.sm.state.image.get()} alt="Profile" class="w-16 h-16 rounded-full mt-2" />
      </Show>
    </div>
  )
}

function EmailField(p: HasUserProfileFormStateManagement) {
  return (
    <FormFieldInput
      config={userProfileFormConfig.email}
      value={p.sm.state.email.get()}
      error={p.sm.errors.email.get()}
      mode={p.sm.mode}
      onInput={(value) => {
        p.sm.state.email.set(value)
      }}
      onBlur={(value) => {
        p.sm.state.email.set(value)
      }}
    />
  )
}

function BioField(p: HasUserProfileFormStateManagement) {
  return (
    <FormFieldInput
      config={userProfileFormConfig.bio}
      value={p.sm.state.bio.get()}
      error={p.sm.errors.bio.get()}
      mode={p.sm.mode}
      onInput={(value) => {
        p.sm.state.bio.set(value)
      }}
      onBlur={(value) => {
        p.sm.state.bio.set(value)
      }}
    />
  )
}

function UrlField(p: HasUserProfileFormStateManagement) {
  return (
    <FormFieldInput
      config={userProfileFormConfig.url}
      value={p.sm.state.url.get()}
      error={p.sm.errors.url.get()}
      mode={p.sm.mode}
      onInput={(value) => {
        p.sm.state.url.set(value)
      }}
      onBlur={(value) => {
        p.sm.state.url.set(value)
      }}
    />
  )
}

function RoleField(p: HasUserProfileFormStateManagement) {
  return (
    <FormFieldInput
      config={userProfileFormConfig.role}
      value={p.sm.state.role.get()}
      error={p.sm.errors.role.get()}
      mode={p.sm.mode}
      onInput={(value) => {
        p.sm.state.role.set(value as UserRole)
      }}
      onBlur={(value) => {
        p.sm.state.role.set(value as UserRole)
      }}
    />
  )
}

function OrgHandleField(p: HasUserProfileFormStateManagement) {
  return (
    <FormFieldInput
      config={userProfileFormConfig.orgHandle}
      value={p.sm.state.orgHandle.get()}
      error={p.sm.errors.orgHandle.get()}
      mode={p.sm.mode}
      onInput={(value) => {
        p.sm.state.orgHandle.set(value)
      }}
      onBlur={(value) => {
        p.sm.state.orgHandle.set(value)
      }}
    />
  )
}

function OrgRoleField(p: HasUserProfileFormStateManagement) {
  return (
    <FormFieldInput
      config={userProfileFormConfig.orgRole}
      value={p.sm.state.orgRole.get()}
      error={p.sm.errors.orgRole.get()}
      mode={p.sm.mode}
      onInput={(value) => {
        p.sm.state.orgRole.set(value as OrgRole)
      }}
      onBlur={(value) => {
        p.sm.state.orgRole.set(value as OrgRole)
      }}
    />
  )
}

function CreatedAtField(p: HasUserProfileFormStateManagement) {
  return (
    <div class="flex flex-col gap-2">
      <Label for={userProfileFormField.createdAt}>{ttc("Created At")}</Label>
      <DateView date={p.sm.state.createdAt.get()} class="w-full bg-hover p-2 rounded-md text-sm" />
    </div>
  )
}

function getUserProfileTitle(mode: FormMode): string {
  // return getFormModeTitle(mode, ttt("User Profile"))
  return ttc("User Profile")
}
