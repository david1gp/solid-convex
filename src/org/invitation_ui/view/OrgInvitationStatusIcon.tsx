import type { OrgInvitationStatusProps } from "#src/org/invitation_ui/view/OrgInvitationStatusText.tsx"
import { invitationModelToStatus, orgInvitationStatusIcon } from "#src/org/invitation_ui/view/orgInvitationStatus.ts"
import { Icon } from "#ui/static/icon/Icon.jsx"
import { cn } from "cn"

export function OrgInvitationStatusIcon(p: OrgInvitationStatusProps) {
  return <Icon path={orgInvitationStatusIcon[invitationModelToStatus(p.invitation)]} class={cn("size-8", p.class)} />
}
