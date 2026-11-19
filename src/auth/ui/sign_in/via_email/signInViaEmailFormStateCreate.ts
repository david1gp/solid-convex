import { onSettled as onMount } from "solid-js"
import { createSignInViaEmailStateManagement } from "#src/auth/ui/sign_in/via_email/createSignInViaEmailStateManagement.ts"
import { addKeyboardListenerAlt } from "#src/auth/ui/sign_up/form/addKeyboardListenerAlt.ts"
import { isDevEnv } from "#src/utils/env/isDevEnv.ts"
import { createUrl } from "#src/utils/router/createUrl.ts"
import { searchParamSet } from "#src/utils/router/searchParamSet.ts"

export function signInViaEmailFormStateCreate(factory: () => typeof createSignInViaEmailStateManagement | undefined) {
  const demo = !!factory()
  const sm = (factory() ?? createSignInViaEmailStateManagement)()
  let url: URL | null = null
  if (!demo) {
    onMount(() => {
      url = createUrl()
    })
    if (isDevEnv()) addKeyboardListenerAlt("t", sm.fillTestData)
  }
  return {
    ...sm,
    emailInput: (value: string) => {
      sm.state.email.set(value)
      sm.validateOnChange("email")(value)
      if (url) searchParamSet("email", value)
    },
    emailBlur: (value: string) => sm.validateOnChange("email")(value),
  }
}
