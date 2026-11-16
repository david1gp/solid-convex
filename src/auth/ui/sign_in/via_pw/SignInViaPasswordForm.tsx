import { ttc } from "#src/app/i18n/ttc.ts"
import { signInViaPasswordFormStateCreate } from "#src/auth/ui/sign_in/via_pw/signInViaPasswordFormStateCreate.ts"
import { FormFieldInput } from "#src/ui/form/FormFieldInput.tsx"
import { formFieldConfigs } from "#src/ui/form/formFieldConfigs.ts"
import { formMode } from "#ui/input/form/formMode.ts"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { cn } from "cn"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"
import type { signInViaPasswordCreateStateManagement } from "./signInViaPasswordCreateStateManagement.js"

export function SignInViaPasswordForm(
  p: MayHaveClass & { stateFactory?: typeof signInViaPasswordCreateStateManagement },
) {
  const sm = signInViaPasswordFormStateCreate(() => p.stateFactory)

  return (
    <form onSubmit={sm.handleSubmit} autocomplete="on" class={cn("flex flex-col gap-4", p.class)}>
      <FormFieldInput
        config={{
          ...formFieldConfigs.email,
          name: "Sign-in-via-password-email",
          label: () => "Email",
          placeholder: () => "Email",
          labelClass: "sr-only",
          required: true,
        }}
        value={sm.state.email.get()}
        error={sm.errors.email.get()}
        mode={formMode.add}
        onInput={sm.emailInput}
        onBlur={sm.emailBlur}
      />
      <FormFieldInput
        config={{
          name: "password",
          label: () => ttc("Password"),
          labelClass: "sr-only",
          placeholder: () => ttc("Password"),
          type: "password",
          autocomplete: "current-password",
          required: true,
        }}
        value={sm.state.password.get()}
        error={sm.errors.password.get()}
        mode={formMode.add}
        onInput={sm.passwordInput}
        onBlur={sm.passwordBlur}
      />
      <ButtonIcon
        type="submit"
        isLoading={sm.state.isSubmitting.get()}
        variant={sm.hasErrors() ? buttonVariant.filledRed : buttonVariant.filledIndigo}
        class="w-full"
      >
        {sm.state.isSubmitting.get() ? ttc("Signing in...") : ttc("Sign in")}
      </ButtonIcon>
    </form>
  )
}
