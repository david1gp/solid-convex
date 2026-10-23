import { appIcons } from "#src/app/icon/appIcons.ts"
import { ttc } from "#src/app/i18n/ttc.ts"
import type { OrgInvitationModel } from "#src/org/invitation_model/orgInvitationSchema.ts"
import type { OrgModel } from "#src/org/org_model/OrgModel.ts"
import { orgRoleGetText } from "#src/org/org_model_field/orgRoleGetText.ts"
import { OrgViewInformation } from "#src/org/org_ui/view/OrgViewInformation.tsx"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { classesCardWrapperP8 } from "#ui/static/card/classesCardWrapper.ts"
import { classArr } from "#ui/utils/classArr.ts"

interface OrgInvitationAcceptViewProps {
  invitation: OrgInvitationModel
  org: OrgModel
  onAccept: () => void | Promise<void>
  accepted?: boolean
}

export function OrgInvitationAcceptView(p: OrgInvitationAcceptViewProps) {
  return (
    <div class="space-y-6">
      <OrgViewInformation showEditButton={false} org={p.org} />
      <section class={classArr(classesCardWrapperP8, "max-w-md mx-auto", "mt-10 mb-15")}>
        <h2 class="text-xl font-semibold mb-4">{ttc("Accept Invitation")}</h2>
        <p class="text-muted-foreground mb-4">
          {ttc("You have been invited to join as")} {orgRoleGetText(p.invitation.role)}.
        </p>
        <ButtonIcon
          icon={appIcons.accept}
          variant={buttonVariant.filledIndigo}
          onClick={p.onAccept}
          disabled={p.accepted}
        >
          {p.accepted ? ttc("Invitation accepted") : ttc("Accept Invitation")}
        </ButtonIcon>
      </section>
    </div>
  )
}
