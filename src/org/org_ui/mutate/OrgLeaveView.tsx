import { appIcons } from "#src/app/icon/appIcons.ts"
import { ttc, ttc1 } from "#src/app/i18n/ttc.ts"
import type { OrgModel } from "#src/org/org_model/OrgModel.ts"
import { OrgViewInformation } from "#src/org/org_ui/view/OrgViewInformation.tsx"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { classesCardWrapperP8 } from "#ui/static/card/classesCardWrapper.ts"
import { classArr } from "#ui/utils/classArr.ts"

export function OrgLeaveView(p: { org: OrgModel; onLeave: () => void; loading?: boolean }) {
  return (
    <div class="space-y-6">
      <OrgViewInformation showEditButton={false} org={p.org} />
      <section class={classArr(classesCardWrapperP8, "max-w-md mx-auto", "mt-10 mb-15")}>
        <h2 class="text-xl font-semibold mb-4">{ttc("Leave Organization?")}</h2>
        <p class="text-muted-foreground mb-2">
          {ttc1("Are you sure you want to leave [X]?", p.org.name ?? p.org.orgHandle)}
        </p>
        <p class="text-muted-foreground mb-6">{ttc("You will lose access to all previously created data")}</p>
        <ButtonIcon
          icon={appIcons.leave}
          variant={buttonVariant.filledRed}
          onClick={p.onLeave}
          disabled={p.loading}
          isLoading={p.loading}
          class="w-full"
        >
          {ttc("Leave Organization")}
        </ButtonIcon>
      </section>
    </div>
  )
}
