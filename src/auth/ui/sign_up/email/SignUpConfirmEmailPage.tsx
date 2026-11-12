import type { Component } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { EnterOtpForm } from "#src/auth/ui/email/EnterOtpForm.tsx"
import { classesAuthCard } from "#src/auth/ui/shared/classesAuthCard.ts"
import { AuthSplitLayout } from "#src/auth/ui/shared/AuthSplitLayout.tsx"
import { signUpConfirmEmailViewStateCreate } from "#src/auth/ui/sign_up/email/signUpConfirmEmailViewStateCreate.ts"
import { LayoutWrapperDemo } from "#ui/static/layout/LayoutWrapperDemo.jsx"
import { classArr } from "#ui/utils/classArr.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export const SignUpConfirmEmailPage: Component<{}> = () => {
  return (
    <LayoutWrapperDemo title={ttc("Sign Up / Confirm Email")}>
      <SignUpConfirmEmailView />
    </LayoutWrapperDemo>
  )
}

export const SignUpConfirmEmailView: Component<
  MayHaveClass & { actionFn?: (otp: string, email: string, returnPath: string) => Promise<void>; initialEmail?: string }
> = (p) => {
  const state = signUpConfirmEmailViewStateCreate(() => p)
  return (
    <AuthSplitLayout>
      <section class={classArr(classesAuthCard, p.class)}>
        <EnterOtpForm
          title={ttc("Verify Your Email")}
          subtitle={ttc("Almost there! Confirm your email to activate your account.")}
          sentMessage={ttc("We’ve sent a 6-digit code to")}
          instruction={ttc("Enter it below to verify your email and complete your registration.")}
          buttonText={ttc("Verify Email")}
          actionFn={state.actionFn}
          initialEmail={p.initialEmail}
          class="w-full"
        />
      </section>
    </AuthSplitLayout>
  )
}
