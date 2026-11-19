import { createEffect } from "solid-js"
import { api } from "#convex/_generated/api.js"
import { orgInvitationFormStateManagement } from "#src/org/invitation_ui/form/orgInvitationFormStateManagement.ts"
import { queryCreate } from "#src/utils/convex_client/queryCreate.ts"
import type { FormMode } from "#ui/input/form/formMode.ts"

export function orgInvitationMutateStateCreate(p: {
  mode: () => FormMode
  orgHandle: () => string
  invitationCode: () => string
}) {
  const getInvitation = queryCreate(api.org.orgInvitationGetQuery, () => ({
    orgHandle: p.orgHandle(),
    invitationCode: p.invitationCode(),
  }))

  const sm = orgInvitationFormStateManagement(p.mode(), p.orgHandle(), p.invitationCode())

  function getInvitationData() {
    const result = getInvitation()
    if (!result?.success) {
      return null
    }
    return result.data
  }

  function getInvitationErrorMessage() {
    const result = getInvitation()
    if (!result || result.success) {
      return ""
    }
    return result.errorMessage
  }

  createEffect(
    () => getInvitationData(),
    (invitation) => {
      if (!invitation) {
        return
      }
      sm.loadData(invitation)
    },
  )

  return { sm, getInvitation, getInvitationData, getInvitationErrorMessage }
}
