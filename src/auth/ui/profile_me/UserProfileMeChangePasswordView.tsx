import { Show } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { FormFieldInput } from "#src/ui/form/FormFieldInput.tsx"
import { formMode } from "#ui/input/form/formMode.ts"
import { Button } from "#ui/interactive/button/Button.tsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { profileMeFormFieldConfig } from "./profileMeFormFieldConfig.ts"
import { userProfileMeChangePasswordPageStateCreate } from "./userProfileMeChangePasswordPageStateCreate.ts"

export function UserProfileMeChangePasswordView(p: {
  stateFactory?: typeof userProfileMeChangePasswordPageStateCreate
}) {
  const state = (p.stateFactory ?? userProfileMeChangePasswordPageStateCreate)()
  return (
    <div class="max-w-xl mx-auto">
      <h1 class="text-3xl font-bold mb-4">{ttc("Change Password")}</h1>
      <div class="rounded-md border border-border bg-background p-4 sm:p-5">
        <Show when={state.step() === 1}>
          <form class="space-y-6" onSubmit={state.request}>
            <div>
              <h2 class="text-sm font-semibold mb-2">{ttc("Step 1: Send Verification Code")}</h2>
              <p class="text-sm text-muted-foreground mb-6">
                {ttc("We'll send a verification code to your email address.")}
              </p>
            </div>
            <Button type="submit" variant={buttonVariant.filledIndigo} disabled={state.submitting()} class="w-full">
              {state.submitting() ? ttc("Sending...") : ttc("Send Code to my email")}
            </Button>
          </form>
        </Show>
        <Show when={state.step() === 2}>
          <form class="space-y-6" onSubmit={state.confirm}>
            <div>
              <h2 class="text-sm font-semibold mb-2">{ttc("Step 2: Enter Confirmation Code")}</h2>
              <p class="text-sm text-muted-foreground mb-6">
                {ttc("Enter the 6-digit code from your email and your new password.")}
              </p>
            </div>
            <FormFieldInput
              config={profileMeFormFieldConfig.confirmationCode}
              value={state.code()}
              error={state.codeError()}
              mode={formMode.edit}
              onInput={state.codeInput}
              onBlur={state.codeInput}
            />
            <FormFieldInput
              config={profileMeFormFieldConfig.newPassword}
              value={state.password()}
              error={state.passwordError()}
              mode={formMode.edit}
              onInput={state.passwordInput}
              onBlur={state.passwordInput}
            />
            <div class="space-y-3">
              <Button type="submit" variant={buttonVariant.filledIndigo} disabled={state.submitting()} class="w-full">
                {state.submitting() ? ttc("Confirming...") : ttc("Change Password")}
              </Button>
              <Button type="button" variant={buttonVariant.outline} onClick={state.back} class="w-full">
                {ttc("Back")}
              </Button>
            </div>
          </form>
        </Show>
        <p role="status">{state.message()}</p>
      </div>
    </div>
  )
}
