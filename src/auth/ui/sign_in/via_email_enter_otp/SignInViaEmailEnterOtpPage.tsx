import { ttc } from "#src/app/i18n/ttc.ts"
import { SignInViaEmailEnterOtpView } from "#src/auth/ui/sign_in/via_email_enter_otp/SignInViaEmailEnterOtpView.tsx"
import { signInViaEmailEnterOtpPageStateCreate } from "#src/auth/ui/sign_in/via_email_enter_otp/signInViaEmailEnterOtpPageStateCreate.ts"
import { LayoutWrapperDemo } from "#ui/static/layout/LayoutWrapperDemo.jsx"

export function SignInViaEmailEnterOtpPage() {
  const state = signInViaEmailEnterOtpPageStateCreate()
  return (
    <LayoutWrapperDemo title={ttc("Enter Code to Sign In")}>
      <SignInViaEmailEnterOtpView actionFn={state.confirm} />
    </LayoutWrapperDemo>
  )
}
