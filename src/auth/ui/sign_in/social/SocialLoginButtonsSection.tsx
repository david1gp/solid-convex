import { socialLoginProvider } from "#src/auth/model_field/socialLoginProvider.ts"
import { SocialLoginButton } from "#src/auth/ui/sign_in/social/SocialLoginButton.tsx"
import { classArr } from "#ui/utils/classArr.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface SocialLoginButtonsProps extends MayHaveClass {
  redirectPath?: string
}

const signInUsingSocials = "signInUsingSocials"

export function SocialLoginButtonsSection(p: SocialLoginButtonsProps) {
  const buttonClasses = "justify-start"
  return (
    <section id={signInUsingSocials} class={classArr("flex flex-col gap-4 max-w-2xl", p.class)}>
      <h2 class="text-left">Sign in using social account</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SocialLoginButton provider={socialLoginProvider.google} class={buttonClasses} />
        <SocialLoginButton provider={socialLoginProvider.github} class={buttonClasses} />
      </div>
    </section>
  )
}
