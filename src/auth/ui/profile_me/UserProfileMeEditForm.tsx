import { ttc } from "#src/app/i18n/ttc.ts"
import { userProfileFormConfig } from "#src/auth/ui/profile/userProfileFormField.ts"
import { urlUserProfileMe } from "#src/auth/url/pageRouteAuth.ts"
import { FormFieldInput } from "#src/ui/form/FormFieldInput.tsx"
import { formMode } from "#ui/input/form/formMode.ts"
import { Button } from "#ui/interactive/button/Button.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { classMerge } from "#ui/utils/classMerge.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"
import type { UserProfileMeEditFormStateManagement } from "./userProfileMeEditFormState.js"
import { userProfileMeEditFormViewStateCreate } from "./userProfileMeEditFormViewStateCreate.ts"

export interface UserProfileMeEditFormProps extends MayHaveClass {
  sm: UserProfileMeEditFormStateManagement
  onSave?: (sm: UserProfileMeEditFormStateManagement) => void
  cancelHref?: string
}

export function UserProfileMeEditForm(p: UserProfileMeEditFormProps) {
  const state = userProfileMeEditFormViewStateCreate(() => p)
  return (
    <div class={classMerge("rounded-md border border-border bg-background p-4 sm:p-5", p.class)}>
      <form class="space-y-6" onSubmit={state.handleSubmit}>
        <NameField sm={p.sm} />
        <BioField sm={p.sm} />
        <UrlField sm={p.sm} />

        <div class="mt-6 flex justify-end space-x-4">
          <LinkButtonInternal to={p.cancelHref ?? urlUserProfileMe()} variant={buttonVariant.link}>
            {ttc("Cancel")}
          </LinkButtonInternal>
          <Button type="submit" variant={buttonVariant.filledIndigo} disabled={p.sm.isLoading.get()}>
            {p.sm.isLoading.get() ? ttc("Saving...") : ttc("Save Changes")}
          </Button>
        </div>
      </form>
    </div>
  )
}

interface HasUserProfileMeEditFormStateManagement {
  sm: UserProfileMeEditFormStateManagement
}

function NameField(p: HasUserProfileMeEditFormStateManagement) {
  return (
    <div>
      <FormFieldInput
        config={userProfileFormConfig.name}
        value={p.sm.state.name.get()}
        error={p.sm.errors.name.get()}
        mode={formMode.edit}
        onInput={(value: string) => {
          p.sm.state.name.set(value)
        }}
        onBlur={(value: string) => {
          p.sm.state.name.set(value)
        }}
      />
    </div>
  )
}

function BioField(p: HasUserProfileMeEditFormStateManagement) {
  return (
    <div>
      <FormFieldInput
        config={userProfileFormConfig.bio}
        value={p.sm.state.bio.get()}
        error={p.sm.errors.bio.get()}
        mode={formMode.edit}
        onInput={(value: string) => {
          p.sm.state.bio.set(value)
        }}
        onBlur={(value: string) => {
          p.sm.state.bio.set(value)
        }}
      />
    </div>
  )
}

function UrlField(p: HasUserProfileMeEditFormStateManagement) {
  return (
    <div>
      <FormFieldInput
        config={userProfileFormConfig.url}
        value={p.sm.state.url.get()}
        error={p.sm.errors.url.get()}
        mode={formMode.edit}
        onInput={(value: string) => {
          p.sm.state.url.set(value)
        }}
        onBlur={(value: string) => {
          p.sm.state.url.set(value)
        }}
      />
    </div>
  )
}
