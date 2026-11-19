import { untrack } from "solid-js"
import { userProfileMeEditFormStateManagement } from "./userProfileMeEditFormState.ts"

export function userProfileMeEditViewStateCreate(
  props: () => { profile: { name: string; bio?: string; url?: string } },
) {
  // The edit form owns a draft and its original baseline until it is remounted.
  const profile = untrack(() => props().profile)
  return {
    sm: userProfileMeEditFormStateManagement({ name: profile.name, bio: profile.bio ?? "", url: profile.url ?? "" }),
  }
}
