import { mdiAccountAlert } from "@adaptive-ds/mdi/mdiAccountAlert.js"
import { api } from "#convex/_generated/api.js"
import { signInSessionNew } from "#src/auth/ui/sign_in/logic/signInSessionNew.ts"
import { userTokenGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import { urlUserProfileMe } from "#src/auth/url/pageRouteAuth.ts"
import type { OrgModel } from "#src/org/org_model/OrgModel.ts"
import { mutationCreate } from "#src/utils/convex_client/mutationCreate.ts"
import { toastAdd } from "#ui/interactive/toast/toastAdd.ts"
import { toastVariant } from "#ui/interactive/toast/toastVariant.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

export function orgLeaveViewLiveStateCreate(p: { org: () => OrgModel }) {
  const leaveMutation = mutationCreate(api.org.orgLeaveMutation)
  const loadingSignal = createSignalObject(false)

  async function handleLeave() {
    loadingSignal.set(true)
    const leaveResult = await leaveMutation({
      token: userTokenGet(),
      orgHandle: p.org().orgHandle,
    })

    if (!leaveResult.success) {
      toastAdd({
        icon: mdiAccountAlert,
        title: leaveResult.errorMessage,
        variant: toastVariant.error,
      })
      loadingSignal.set(false)
      return
    }

    signInSessionNew(leaveResult.data)
    window.location.href = urlUserProfileMe()
  }

  return { loading: loadingSignal.get, onLeave: handleLeave }
}
