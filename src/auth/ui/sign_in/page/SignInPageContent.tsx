import { mdiLockOutline } from "@adaptive-ds/mdi/mdiLockOutline.js"
import { Show } from "solid-js"
import { enableGithub } from "#src/app/config/enableGithub.ts"
import { ttc } from "#src/app/i18n/ttc.ts"
import { loginProvider } from "#src/auth/model_field/socialLoginProvider.ts"
import { classesAuthCard } from "#src/auth/ui/shared/classesAuthCard.ts"
import { AuthSectionCard } from "#src/auth/ui/shared/AuthSectionCard.tsx"
import { AuthSplitLayout } from "#src/auth/ui/shared/AuthSplitLayout.tsx"
import { AdminLoginSection } from "#src/auth/ui/sign_in/admin/AdminLoginSection.tsx"
import { AuthworksSignInSection } from "#src/auth/ui/sign_in/authworks/AuthworksSignInSection.tsx"
import { SignInWithAnExistingSession } from "#src/auth/ui/sign_in/existing/SignInWithAnExistingSession.tsx"
import { AuthLegalAgree } from "#src/auth/ui/sign_in/legal/AuthLegalAgree.tsx"
import { authLegalAgreeVariant } from "#src/auth/ui/sign_in/legal/authLegalAgreeVariant.tsx"
import { OidcSignInSection } from "#src/auth/ui/sign_in/oidc/OidcSignInSection.tsx"
import { SignUpButtonLink } from "#src/auth/ui/sign_in/page/SignUpButtonLink.tsx"
import { SocialLoginButton } from "#src/auth/ui/sign_in/social/SocialLoginButton.tsx"
import { SignInViaEmailForm } from "#src/auth/ui/sign_in/via_email/SignInViaEmailForm.tsx"
import { signInViaEmailDemoStateCreate } from "#src/auth/ui/sign_in/via_email/signInViaEmailDemoStateCreate.ts"
import { SignInViaPasswordForm } from "#src/auth/ui/sign_in/via_pw/SignInViaPasswordForm.tsx"
import { signInViaPasswordDemoStateCreate } from "#src/auth/ui/sign_in/via_pw/signInViaPasswordDemoStateCreate.ts"
import { Icon } from "#ui/static/icon/Icon.jsx"
import { iconGithub } from "#ui/static/icons/iconGithub.ts"
import { iconGoogle } from "#ui/static/icons/iconGoogle.ts"
import { classArr } from "#ui/utils/classArr.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export function SignInPageContent(p: MayHaveClass & { demo?: boolean }) {
  return (
    <AuthSplitLayout class={p.class}>
      <h1 class="text-base font-semibold lg:text-lg">{ttc("Sign In")}</h1>
      <p class="text-sm text-muted-foreground">{ttc("Sign in with")}</p>
      <Show when={p.demo}>
        <p>Demo only — no account or network request is used.</p>
      </Show>
      <Show when={!p.demo}>
        <SignInWithAnExistingSession h2Class="text-sm font-semibold" innerClass="flex flex-col gap-2" />
      </Show>

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
        <AuthLegalAgree variant={authLegalAgreeVariant.signIn} class="text-center text-xs" />
      </Show>
      <NoAccountSection class="text-center" />
    </AuthSplitLayout>
  )
}

function AuthSectionSocials() {
  return (
    <Show
      when={enableGithub()}
      fallback={
        <AuthSectionCard icon={iconGoogle} title={ttc("Google")} subtitle={ttc("One-click sign in")}>
          <SocialLoginButton provider={loginProvider.google} class="w-full" />
        </AuthSectionCard>
      }
    >
      <section class={classesAuthCard}>
        <div class="mb-3 flex items-center gap-3">
          <span class="grid size-9 shrink-0 place-items-center rounded-md bg-hover">
            <Icon path={iconGoogle} class="size-5" />
          </span>
          <span class="grid size-9 shrink-0 place-items-center rounded-md bg-hover">
            <Icon path={iconGithub} class="size-5" />
          </span>
          <div class="min-w-0">
            <h2 class="text-sm font-semibold">{ttc("Socials")}</h2>
            <p class="text-xs text-muted-foreground">{ttc("One-click sign in")}</p>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <SocialLoginButton provider={loginProvider.google} class="w-full" />
          <SocialLoginButton provider={loginProvider.github} class="w-full" />
        </div>
      </section>
    </Show>
  )
}

function NoAccountSection(p: MayHaveClass) {
  return (
    <p class={classArr("text-sm text-muted-foreground", p.class)}>
      {ttc("Don't have an account?")} <SignUpButtonLink text={ttc("Sign Up instead")} />
    </p>
  )
}
