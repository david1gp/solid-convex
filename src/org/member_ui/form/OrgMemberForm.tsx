import { mdiChevronDown } from "@adaptive-ds/mdi/mdiChevronDown.js"
import { Show } from "solid-js"
import { appIcons } from "#src/app/icon/appIcons.ts"
import { ttc } from "#src/app/i18n/ttc.ts"
import { addKeyboardListenerAlt } from "#src/auth/ui/sign_up/form/addKeyboardListenerAlt.ts"
import { orgMemberFormField } from "#src/org/member_ui/form/orgMemberFormField.ts"
import type { OrgMemberFormStateManagement } from "#src/org/member_ui/form/orgMemberFormStateManagement.ts"
import { orgRole } from "#src/org/org_model_field/orgRole.ts"
import { isDevEnv } from "#src/utils/env/isDevEnv.ts"
import { type FormMode, formMode, getFormModeTitle } from "#ui/input/form/formMode.ts"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { Icon } from "#ui/static/icon/Icon.jsx"
import { classMerge } from "#ui/utils/classMerge.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

interface HasOrgMemberFormStateManagement {
  sm: OrgMemberFormStateManagement
}

export interface OrgMemberContentProps extends MayHaveClass, HasOrgMemberFormStateManagement {
  mode: FormMode
}

export function OrgMemberForm(p: OrgMemberContentProps) {
  if (isDevEnv()) {
    addKeyboardListenerAlt("t", p.sm.fillTestData)
  }
  return (
    <section class={classMerge("px-2 sm:px-4 pb-10", "text-gray-900 dark:text-gray-100", p.class)}>
      <h1 class="text-2xl font-bold mt-6 mb-2">{getOrgMemberTitle(p.mode)}</h1>
      <form class="space-y-4" onSubmit={p.sm.handleSubmit}>
        <RoleField sm={p.sm} />
        <ButtonIcon
          type="submit"
          icon={p.mode === formMode.add ? appIcons.create : appIcons.save}
          variant={p.sm.hasErrors() ? buttonVariant.filledRed : buttonVariant.filledIndigo}
          isLoading={p.sm.isSubmitting.get()}
          class="w-full"
        >
          {p.sm.isSubmitting.get() ? "Saving..." : getOrgMemberTitle(p.mode)}
        </ButtonIcon>
      </form>
    </section>
  )
}

function RoleField(p: HasOrgMemberFormStateManagement) {
  return (
    <div class="flex flex-col gap-2">
      <label for={orgMemberFormField.role} class="text-sm font-medium">
        {ttc("Role")}
      </label>
      <div class="relative w-full min-w-0">
        <select
          id={orgMemberFormField.role}
          value={p.sm.state.role.get()}
          onChange={(e) => {
            p.sm.state.role.set(e.currentTarget.value)
            p.sm.validateOnChange(orgMemberFormField.role)(e.currentTarget.value)
          }}
          class={classMerge(
            "w-full appearance-none pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
            p.sm.errors.role.get() && "border-destructive focus-visible:ring-destructive",
          )}
        >
          <option value={orgRole.member}>{ttc("Member")}</option>
          <option value={orgRole.guest}>{ttc("Guest")}</option>
        </select>
        <Icon
          path={mdiChevronDown}
          class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-900 dark:text-white"
        />
      </div>
      <Show when={p.sm.errors.role.get()}>
        <p class="text-destructive">{p.sm.errors.role.get()}</p>
      </Show>
    </div>
  )
}

function getOrgMemberTitle(mode: FormMode): string {
  return getFormModeTitle(mode, ttc("Organization Member"))
}
