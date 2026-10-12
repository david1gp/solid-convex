import { mdiClose } from "@adaptive-ds/mdi/mdiClose.js"
import { mdiEmailFast } from "@adaptive-ds/mdi/mdiEmailFast.js"
import { Show } from "solid-js"
import { api } from "#convex/_generated/api.js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { DateView } from "#src/ui/date/DateView.tsx"
import { createAction } from "#src/utils/convex_client/createAction.ts"
import { mutationCreate } from "#src/utils/convex_client/mutationCreate.ts"
import type { WorkspaceInvitationModel } from "#src/workspace/invitation_model/WorkspaceInvitationModel.ts"
import { workspaceInvitationShowRole } from "#src/workspace/invitation_model/workspaceInvitationShowRole.ts"
import {
  invitationModelToStatus,
  workspaceInvitationStatusIcon,
  workspaceInvitationStatusText,
} from "#src/workspace/invitation_ui/orgInvitationStatus.ts"
import { workspaceRoleGetText } from "#src/workspace/workspace_model_field/workspaceRoleGetText.ts"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { toastAdd } from "#ui/interactive/toast/toastAdd.ts"
import { toastVariant } from "#ui/interactive/toast/toastVariant.ts"
import { Icon } from "#ui/static/icon/Icon.jsx"
import { classArr } from "#ui/utils/classArr.ts"
import { classMerge } from "#ui/utils/classMerge.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"
import type { MayHaveClassAndChildren } from "#ui/utils/MayHaveClassAndChildren.ts"

export interface WorkspaceInvitationCardProps extends MayHaveClass {
  invitation: WorkspaceInvitationModel
  onResend?: (code: string) => void
  onDismiss?: (code: string) => void
  acceptHref?: string
}

export function WorkspaceInvitationCard(p: WorkspaceInvitationCardProps) {
  return (
    <section
      class={classMerge(
        "p-4",
        "border border-gray-200 dark:border-slate-700 rounded-lg ",
        "bg-gray-50 dark:bg-stone-800",
        "flex flex-col justify-start gap-2",
        p.class,
      )}
    >
      <div class="flex justify-start gap-2">
        <Left {...p} />
        <Right {...p} />
      </div>
      <WorkspaceInvitationStatusTextDetails invitation={p.invitation} />
      <WorkspaceInvitationActions {...p} />
    </section>
  )
}

function Left(p: WorkspaceInvitationCardProps) {
  return (
    <div class="flex-1 flex flex-col justify-start gap-2">
      <h3 class="text-xl font-medium">{p.invitation.invitedEmail}</h3>
      {workspaceInvitationShowRole && (
        <div class="text-muted-foreground capitalize">
          <span>{ttc("Role:")}</span>
          {workspaceRoleGetText(p.invitation.role)}
        </div>
      )}
      <WorkspaceInvitationStatusText invitation={p.invitation} />
    </div>
  )
}

function Right(p: WorkspaceInvitationCardProps) {
  return (
    <div
      class={classArr(
        "size-14",
        "bg-gray-200 dark:bg-gray-600",
        "rounded-full",
        "flex flex-col justify-center items-center",
      )}
    >
      <WorkspaceInvitationStatusIcon invitation={p.invitation} />
    </div>
  )
}

function WorkspaceInvitationActions(p: WorkspaceInvitationCardProps) {
  const resendAction = p.onResend ? undefined : createAction(api.workspace.workspaceInvitation30ResendAction)
  const dismissAction = p.onDismiss ? undefined : mutationCreate(api.workspace.workspaceInvitation60DismissMutation)
  async function resendClick() {
    if (p.onResend) return p.onResend(p.invitation.invitationCode)
    const { userTokenGet } = await import("#src/auth/ui/signals/userSessionSignal.ts")
    const result = await resendAction!({
      token: userTokenGet(),
      invitationCode: p.invitation.invitationCode,
    })
    if (!result.success) {
      const icon = mdiEmailFast
      const title = result.errorMessage
      toastAdd({ icon, title, variant: toastVariant.error })
    }
  }

  async function dismissClick() {
    if (p.onDismiss) return p.onDismiss(p.invitation.invitationCode)
    const { userTokenGet } = await import("#src/auth/ui/signals/userSessionSignal.ts")
    const gotResult = await dismissAction!({
      token: userTokenGet(),
      invitationCode: p.invitation.invitationCode,
    })
    if (!gotResult.success) {
      const icon = mdiEmailFast
      const title = gotResult.errorMessage
      toastAdd({ icon, title, variant: toastVariant.error })
    }
  }

  return (
    <div class="flex flex-wrap gap-2">
      <Show when={p.acceptHref && p.invitation.status === "pending"}>
        <LinkButtonInternal to={p.acceptHref!} variant={buttonVariant.outline}>
          {ttc("Accept Invitation")}
        </LinkButtonInternal>
      </Show>
      <ButtonIcon variant={buttonVariant.outline} icon={mdiEmailFast} onClick={resendClick} class="flex-1">
        {ttc("Resend")}
      </ButtonIcon>
      <ButtonIcon
        variant={buttonVariant.outline}
        icon={mdiClose}
        iconClass="fill-red-800 text-red-800 dark:fill-red-800 dark:text-red-800"
        onClick={dismissClick}
        class="flex-1"
      >
        {ttc("Remove")}
      </ButtonIcon>
    </div>
  )
}

interface WorkspaceInvitationStatusProps extends MayHaveClassAndChildren {
  invitation: WorkspaceInvitationModel
}

function WorkspaceInvitationStatusText(p: WorkspaceInvitationStatusProps) {
  const status = invitationModelToStatus(p.invitation)
  return <span>{workspaceInvitationStatusText[status]}</span>
}

function WorkspaceInvitationStatusTextDetails(p: WorkspaceInvitationStatusProps) {
  return (
    <Show when={p.invitation.expiresAt}>
      {(getDate) => (
        <DateView date={getDate()} start={<span class="text-muted-foreground mr-1">{`${ttc("Expires")}:`}</span>} />
      )}
    </Show>
  )
}

interface WorkspaceInvitationStatusIconProps extends MayHaveClass {
  invitation: WorkspaceInvitationModel
}

function WorkspaceInvitationStatusIcon(p: WorkspaceInvitationStatusIconProps) {
  return (
    <Icon
      path={workspaceInvitationStatusIcon[invitationModelToStatus(p.invitation)]}
      class={classMerge("size-8", p.class)}
    />
  )
}
