import { Show } from "solid-js"
import type { OrgInvitationModel } from "#src/org/invitation_model/orgInvitationSchema.ts"
import { invitationModelToStatus, orgInvitationStatusText } from "#src/org/invitation_ui/view/orgInvitationStatus.ts"
import { DateView } from "#src/ui/date/DateView.tsx"
import { ttt } from "#ui/i18n/ttt.ts"
import { classMerge } from "#ui/utils/classMerge.ts"
import type { MayHaveClassAndChildren } from "#ui/utils/MayHaveClassAndChildren.ts"

export interface OrgInvitationStatusProps extends MayHaveClassAndChildren {
  invitation: OrgInvitationModel
}

export function OrgInvitationStatusText(p: OrgInvitationStatusProps) {
  const status = invitationModelToStatus(p.invitation)
  return (
    <div class={classMerge("flex flex-col gap-1", p.class)}>
      <span>{orgInvitationStatusText[status]}</span>
      <Show when={p.invitation.emailSendAt}>
        {(getDate) => <DateView date={getDate()} start={ttt("Email send") + " "} />}
      </Show>
      {p.children}
    </div>
  )
}
