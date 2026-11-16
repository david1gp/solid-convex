import type { Component } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { signInViaEmailFormStateCreate } from "#src/auth/ui/sign_in/via_email/signInViaEmailFormStateCreate.ts"
import { FormFieldInput } from "#src/ui/form/FormFieldInput.tsx"
import { formFieldConfigs } from "#src/ui/form/formFieldConfigs.ts"
import { formMode } from "#ui/input/form/formMode.ts"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { cn } from "cn"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"
import { createSignInViaEmailStateManagement } from "./createSignInViaEmailStateManagement.js"

export const SignInViaEmailForm: Component<
  MayHaveClass & { stateFactory?: typeof createSignInViaEmailStateManagement }
> = (p) => {
  const sm = signInViaEmailFormStateCreate(() => p.stateFactory)
  return (
    <form onSubmit={sm.handleSubmit} autocomplete="on" class={cn("space-y-4", p.class)}>
      <FormFieldInput
        config={{
          ...formFieldConfigs.email,
          name: "Sign-in-via-email-email",
          labelClass: "sr-only",
          placeholder: () => ttc("Email"),
          required: true,
        }}
        value={sm.state.email.get()}
        error={sm.errors.email.get()}
        mode={formMode.add}
        onInput={sm.emailInput}
        onBlur={sm.emailBlur}
      />
      <ButtonIcon
        type="submit"
        isLoading={sm.isSubmitting.get()}
        variant={sm.hasErrors() ? buttonVariant.filledRed : buttonVariant.filledIndigo}
        class="w-full"
      >
        {sm.isSubmitting.get() ? ttc("Sending link...") : ttc("Send link")}
      </ButtonIcon>
    </form>
  )
}
