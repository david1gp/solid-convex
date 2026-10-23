import { mdiLockOutline } from "@adaptive-ds/mdi/mdiLockOutline.js"
import { Show } from "solid-js"
import { enableGithub } from "#src/app/config/enableGithub.ts"
import { ttc } from "#src/app/i18n/ttc.ts"
import { loginProvider } from "#src/auth/model_field/socialLoginProvider.ts"
import { AuthSectionCard } from "#src/auth/ui/shared/AuthSectionCard.tsx"
import { AuthSectionHeroIcon } from "#src/auth/ui/shared/AuthSectionHeroIcon.tsx"
import { AdminLoginSection } from "#src/auth/ui/sign_in/admin/AdminLoginSection.tsx"
import { AuthworksSignInSection } from "#src/auth/ui/sign_in/authworks/AuthworksSignInSection.tsx"
import { SignInWithAnExistingSession } from "#src/auth/ui/sign_in/existing/SignInWithAnExistingSession.tsx"
import { AuthLegalAgree } from "#src/auth/ui/sign_in/legal/AuthLegalAgree.tsx"
import { authLegalAgreeVariant } from "#src/auth/ui/sign_in/legal/authLegalAgreeVariant.tsx"
import { OidcSignInSection } from "#src/auth/ui/sign_in/oidc/OidcSignInSection.tsx"
import { AuthMiniHero } from "#src/auth/ui/sign_in/page/AuthMiniHero.tsx"
import { SignUpButtonLink } from "#src/auth/ui/sign_in/page/SignUpButtonLink.tsx"
import { SocialLoginButton } from "#src/auth/ui/sign_in/social/SocialLoginButton.tsx"
import { SignInViaEmailForm } from "#src/auth/ui/sign_in/via_email/SignInViaEmailForm.tsx"
import { signInViaEmailDemoStateCreate } from "#src/auth/ui/sign_in/via_email/signInViaEmailDemoStateCreate.ts"
import { SignInViaPasswordForm } from "#src/auth/ui/sign_in/via_pw/SignInViaPasswordForm.tsx"
import { signInViaPasswordDemoStateCreate } from "#src/auth/ui/sign_in/via_pw/signInViaPasswordDemoStateCreate.ts"
import { buttonSize, buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { classesCardWrapperP4 } from "#ui/static/card/classesCardWrapper.ts"
import { classesGridCols3lg } from "#ui/static/grid/classesGridCols3lg.ts"
import { iconGithub } from "#ui/static/icons/iconGithub.ts"
import { iconGoogle } from "#ui/static/icons/iconGoogle.ts"
import { classArr } from "#ui/utils/classArr.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export function SignInPageContent(p: MayHaveClass & { demo?: boolean }) {
  return (
    <div
      class={classArr(
        "max-w-7xl w-full mx-auto",
        // "space-y-8",
        // "dark:text-white",
        "p-4 pb-8",
        classesGridCols3lg,
        "gap-4 lg:gap-8",
        p.class,
      )}
    >
      <AuthMiniHero class="col-span-full text-center text-balance" />
      <Show when={p.demo} fallback={<NoAccountSection class="col-span-full mx-auto" />}>
        <p class="col-span-full text-center">Demo only — no account or network request is used.</p>
      </Show>
      <Show when={!p.demo}>
        <SignInWithAnExistingSession
          class="col-span-full mx-auto contents"
          h2Class="text-2xl col-span-full text-center"
        />
      </Show>
      <h2 class="text-2xl font-semibold col-span-full text-center">{ttc("Sign in with")}</h2>

      <AuthSectionCard icon={mdiLockOutline} title={ttc("Password")} subtitle={ttc("Traditional sign in")}>
        <SignInViaPasswordForm class="w-full" stateFactory={p.demo ? signInViaPasswordDemoStateCreate : undefined} />
      </AuthSectionCard>

      <AuthSectionCard icon={mdiLockOutline} title={ttc("Magic Link")} subtitle={ttc("Passwordless email")}>
        <SignInViaEmailForm class="w-full" stateFactory={p.demo ? signInViaEmailDemoStateCreate : undefined} />
      </AuthSectionCard>

      <Show when={!p.demo}>
        <OidcSignInSection />
      </Show>
      <Show when={!p.demo}>
        <AuthworksSignInSection />
      </Show>
      <Show when={!p.demo}>
        <AuthSectionSocials />
      </Show>
      <Show when={!p.demo}>
        <AdminLoginSection class="" />
      </Show>
      <Show when={!p.demo}>
        <AuthLegalAgree variant={authLegalAgreeVariant.signIn} class="col-span-full text-center" />
      </Show>
    </div>
  )
}

function AuthSectionSocials() {
  return (
    <Show
      when={enableGithub()}
      fallback={
        <AuthSectionCard icon={iconGoogle} title={ttc("Google")} subtitle={ttc("One-click sign in")}>
          <SocialLoginButton provider={loginProvider.google} size={buttonSize.default} class="w-full" />
        </AuthSectionCard>
      }
    >
      <section class={classArr(classesCardWrapperP4, "flex flex-col items-center")}>
        <div class="flex flex-wrap gap-2">
          <AuthSectionHeroIcon icon={iconGoogle} class="" />
          <AuthSectionHeroIcon icon={iconGithub} class="" />
        </div>
        <h2 class="text-xl font-semibold">{ttc("Socials")}</h2>
        <p class="text-muted-foreground mb-4">{ttc("One-click sign in")}</p>
        <div class="space-y-2">
          <SocialLoginButton provider={loginProvider.google} size={buttonSize.default} class="w-full" />
          <SocialLoginButton provider={loginProvider.github} size={buttonSize.default} class="w-full" />
        </div>
      </section>
    </Show>
  )
}

function NoAccountSection(p: MayHaveClass) {
  return (
    <section class={classArr("flex flex-wrap gap-4 items-center", p.class)}>
      <h2 class="font-medium">{ttc("Don't have an account?")}</h2>
      <SignUpButtonLink text={ttc("Sign Up instead")} variant={buttonVariant.contrast} class="pl-4" />
    </section>
  )
}
