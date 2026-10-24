import { enableSignInAdmin } from "#src/app/config/enableSignInAdmin.ts"
import { urlAuthAdmin } from "#src/auth/url/urlAuthProvider.ts"
import { urlSignInRedirectUrl } from "#src/auth/url/urlSignInRedirectUrl.ts"
import { navigateTo } from "#src/utils/router/navigateTo.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

export function adminLoginSectionStateCreate() {
  const userIdInputSignal = createSignalObject("adaptive-sm")

  function getAdminUrl() {
    const currentUrl = urlSignInRedirectUrl()
    return urlAuthAdmin(userIdInputSignal.get(), currentUrl)
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    const url = getAdminUrl()
    console.log("userId", userIdInputSignal.get())
    console.log("url", url)
    navigateTo(url)
  }

  return { enabled: enableSignInAdmin, userIdInputSignal, getAdminUrl, handleSubmit }
}
