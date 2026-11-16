import { Show } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { AuthLegalAgree } from "#src/auth/ui/sign_in/legal/AuthLegalAgree.tsx"
import { authLegalAgreeVariant } from "#src/auth/ui/sign_in/legal/authLegalAgreeVariant.tsx"
import { FormFieldInput } from "#src/ui/form/FormFieldInput.tsx"
import { formFieldConfigs } from "#src/ui/form/formFieldConfigs.ts"
import { Checkbox } from "#ui/input/check/Checkbox.jsx"
import { formMode } from "#ui/input/form/formMode.ts"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { cn } from "cn"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"
import { type SignUpUiStateManagement, signUpFormField } from "./signUpCreateFormState.js"
import { signUpEmailPasswordFormStateCreate } from "./signUpEmailPasswordFormStateCreate.ts"

interface SignUpEmailPasswordFormProps extends MayHaveClass {
  stateFactory?: () => SignUpUiStateManagement
}

export function SignUpEmailPasswordForm(p: SignUpEmailPasswordFormProps) {
  const sm = signUpEmailPasswordFormStateCreate(() => p)

  return (
    <form onSubmit={sm.handleSubmit} autocomplete="on" class={cn("flex flex-col gap-6", p.class)}>
      <FormFieldInput
        config={{
          ...formFieldConfigs.name,
          placeholder: () => "My Name",
          required: false,
        }}
        value={sm.state.name.get()}
        error={sm.errors.name.get()}
        mode={formMode.add}
        onInput={(value) => {
          sm.state.name.set(value)
          sm.validateOnChange("name")(value)
        }}
        onBlur={(value) => sm.validateOnChange("name")(value)}
      />

      <FormFieldInput
        config={{
          ...formFieldConfigs.email,
          placeholder: () => "my.email@gmail.com",
          required: false,
        }}
        value={sm.state.email.get()}
        error={sm.errors.email.get()}
        mode={formMode.add}
        onInput={(value) => {
          sm.state.email.set(value)
          sm.validateOnChange("email")(value)
        }}
        onBlur={(value) => sm.validateOnChange("email")(value)}
      />

      <FormFieldInput
        config={{
          name: "password",
          label: () => ttc("Password"),
          placeholder: () => ttc("******"),
          type: "password",
          autocomplete: "new-password",
          required: false,
        }}
        value={sm.state.pw.get()}
        error={sm.errors.pw.get()}
        mode={formMode.add}
        onInput={(value) => {
          sm.state.pw.set(value)
          sm.validateOnChange("pw")(value)
        }}
        onBlur={(value) => sm.validateOnChange("pw")(value)}
      />

      <Checkbox
        id={signUpFormField.terms}
        checked={sm.state.terms.get()}
        onChange={(checked) => {
          sm.state.terms.set(checked)
          sm.validateOnChange(signUpFormField.terms)(checked)
        }}
      >
        <AuthLegalAgree variant={authLegalAgreeVariant.signUp} class="ml-1" />
        <Show when={sm.errors.terms.get()}>
          <span id="terms-error" class="text-red-500 block">
            {sm.errors.terms.get()}
          </span>
        </Show>
      </Checkbox>

      <ButtonIcon
        type="submit"
        variant={sm.hasErrors() ? buttonVariant.filledRed : buttonVariant.filledIndigo}
        class="text-lg"
        isLoading={sm.isSubmitting.get()}
      >
        {sm.isSubmitting.get() ? "Signing up..." : "Sign up"}
      </ButtonIcon>
    </form>
  )
}
