import { createEffect } from "solid-js"
import type { UserProfile } from "#src/auth/model/UserProfile.ts"
import { formMode } from "#ui/input/form/formMode.ts"
import { userProfileFormStateManagement } from "./userProfileFormState.ts"

export function userProfileViewStateCreate(profile: () => UserProfile) {
  const sm = userProfileFormStateManagement(formMode.view, {})
  createEffect(
    () => profile(),
    (value) => {
      sm.loadData(value)
    },
  )
  return { sm, mode: formMode.view }
}
