import { mdiAccountHardHat } from "@adaptive-ds/mdi/mdiAccountHardHat.js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { AuthSectionCard } from "#src/auth/ui/shared/AuthSectionCard.tsx"
import { adminLoginSectionStateCreate } from "#src/auth/ui/sign_in/admin/adminLoginSectionStateCreate.ts"
import { FormFieldInput } from "#src/ui/form/FormFieldInput.tsx"
import { formMode } from "#ui/input/form/formMode.ts"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonExternal } from "#ui/interactive/link/LinkButton.jsx"
import { classArr } from "#ui/utils/classArr.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export function AdminLoginSection(_p: MayHaveClass) {
  const state = adminLoginSectionStateCreate()
  if (!state.enabled()) return null

  return (
    <AuthSectionCard icon={mdiAccountHardHat} title={ttc("Admin")} subtitle={ttc("In dev mode only")}>
      <form
        //
        id="adminSignInForm"
        onSubmit={state.handleSubmit}
        autocomplete="on"
        class={classArr("flex flex-col gap-4 w-full")}
      >
        <FormFieldInput
          config={{
            name: "user-id",
            label: () => ttc("User id"),
            labelClass: "sr-only",
            placeholder: () => ttc("User id / Username"),
            required: true,
            autocomplete: "username",
          }}
          value={state.userIdInputSignal.get()}
          error=""
          mode={formMode.edit}
          onInput={(value) => state.userIdInputSignal.set(value)}
          onBlur={() => {}}
        />
        <AdminLoginButton getAdminUrl={state.getAdminUrl} />
      </form>
    </AuthSectionCard>
  )
}

function AdminLoginButton(p: MayHaveClass & { getAdminUrl: () => string }) {
  const text = ttc("Sign in")
  return (
    <LinkButtonExternal href={p.getAdminUrl()} variant={buttonVariant.filledIndigo} class={p.class}>
      {text}
    </LinkButtonExternal>
  )
}
