import { ttc } from "#src/app/i18n/ttc.ts"
import { EnterOtpForm } from "#src/auth/ui/email/EnterOtpForm.tsx"
import { classesAuthCard } from "#src/auth/ui/shared/classesAuthCard.ts"
import { AuthSplitLayout } from "#src/auth/ui/shared/AuthSplitLayout.tsx"

export function SignInViaEmailEnterOtpView(p: {
  actionFn: (otp: string, email: string, returnPath: string) => Promise<void>
  initialEmail?: string
}) {
  return (
    <AuthSplitLayout>
      <section class={classesAuthCard}>
        <EnterOtpForm
          title={ttc("Sign In to Your Account")}
          subtitle={ttc("Almost there! Enter the code we just emailed you to sign In.")}
          sentMessage={ttc("A one-time code was sent to")}
          instruction={ttc("Enter it below to securely sign in.")}
          buttonText={ttc("Sign In")}
          actionFn={p.actionFn}
          initialEmail={p.initialEmail}
          class="w-full"
        />
      </section>
    </AuthSplitLayout>
  )
}
