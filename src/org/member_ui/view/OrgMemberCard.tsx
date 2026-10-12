import { mdiClose } from "@adaptive-ds/mdi/mdiClose.js"
import { mdiEmailOutline } from "@adaptive-ds/mdi/mdiEmailOutline.js"
import { mdiPencil } from "@adaptive-ds/mdi/mdiPencil.js"
import { api } from "#convex/_generated/api.js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { userTokenGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import { orgInvitationShowRole } from "#src/org/invitation_model/orgInvitationShowRole.ts"
import type { OrgMemberProfile } from "#src/org/member_model/OrgMemberProfile.ts"
import type { HasOrgHandle } from "#src/org/org_model_field/HasOrgHandle.ts"
import { DateView } from "#src/ui/date/DateView.tsx"
import { ClipboardCopyButtonIcon } from "#src/ui/links/ClipboardCopyButtonIcon.tsx"
import { mutationCreate } from "#src/utils/convex_client/mutationCreate.ts"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonExternal } from "#ui/interactive/link/LinkButton.jsx"
import { toastAdd } from "#ui/interactive/toast/toastAdd.ts"
import { toastVariant } from "#ui/interactive/toast/toastVariant.ts"
import { classMerge } from "#ui/utils/classMerge.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface OrgMemberCardProps extends MayHaveClass, HasOrgHandle {
  member: OrgMemberProfile
  showActions: boolean
  demo?: boolean
}

export function OrgMemberCard(p: OrgMemberCardProps) {
  return (
    <section
      class={classMerge(
        "p-4", // padding
        "border border-gray-200 dark:border-slate-700 rounded-lg ", // border
        "bg-gray-50 dark:bg-stone-800", // bg
        "flex flex-col justify-start gap-2", // layout children
        p.class,
      )}
    >
      <h3 class="text-xl font-medium">{p.member.profile.name}</h3>

      {p.member.profile.email && (
        <div class="flex flex-wrap gap-1">
          {p.demo ? (
            <span class="flex-1">{p.member.profile.email}</span>
          ) : (
            <LinkButtonExternal
              variant={buttonVariant.subtle}
              icon={mdiEmailOutline}
              href={`mailto:${p.member.profile.email}`}
              class="flex-1 flex"
            >
              {p.member.profile.email}
            </LinkButtonExternal>
          )}
          <ClipboardCopyButtonIcon
            data={p.member.profile.email}
            copyText={ttc("Copy E-Mail to clipboard")}
            toastText={ttc("E-Mail copied")}
          />
        </div>
      )}

      {orgInvitationShowRole && (
        <div class="text-muted-foreground capitalize">
          <span>{ttc("Role:")}</span>
          {p.member.role}
        </div>
      )}
      {p.showActions && <OrgMemberActions {...p} />}

      <ShowTimes {...p} />
    </section>
  )
}

function ShowTimes(p: OrgMemberCardProps) {
  return (
    <div class="space-y-1">
      <div class="flex items-center gap-2">
        <span class="font-medium text-muted-foreground">{ttc("Created at:")}</span>
        <DateView date={p.member.profile.createdAt} />
      </div>
      <div class="flex items-center gap-2">
        <span class="font-medium text-muted-foreground">{ttc("Joined at:")}</span>
        <DateView date={p.member.createdAt} />
      </div>
    </div>
  )
}

function OrgMemberActions(p: OrgMemberCardProps) {
  const editMutation = mutationCreate(api.org.orgMemberEditMutation)
  const deleteMutation = mutationCreate(api.org.orgMemberDeleteMutation)

  async function editClick() {
    const newRole = p.member.role === "member" ? "guest" : "member"
    const gotResult = await editMutation({
      token: userTokenGet(),
      orgHandle: p.orgHandle,
      memberId: p.member.memberId,
      role: newRole,
    })
    if (!gotResult.success) {
      const icon = mdiPencil
      const title = gotResult.errorMessage
      toastAdd({ icon, title, variant: toastVariant.error })
    }
  }

  async function deleteClick() {
    const gotResult = await deleteMutation({
      token: userTokenGet(),
      orgHandle: p.orgHandle,
      memberId: p.member.memberId,
    })
    if (!gotResult.success) {
      const icon = mdiClose
      const title = gotResult.errorMessage
      toastAdd({ icon, title, variant: toastVariant.error })
    }
  }

  return (
    <div class="flex flex-wrap gap-2">
      <ButtonIcon variant={buttonVariant.outline} icon={mdiPencil} onClick={editClick} class="flex-1">
        {ttc("Edit")}
      </ButtonIcon>
      <ButtonIcon
        variant={buttonVariant.outline}
        icon={mdiClose}
        iconClass="fill-red-800 text-red-800 dark:fill-red-800 dark:text-red-800"
        onClick={deleteClick}
        class="flex-1"
      >
        {ttc("Remove")}
      </ButtonIcon>
    </div>
  )
}
