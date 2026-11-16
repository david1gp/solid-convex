import { mdiAccountPlus } from "@adaptive-ds/mdi/mdiAccountPlus.js"
import { type Component, Show } from "solid-js"
import { enableGithub } from "#src/app/config/enableGithub.ts"
import { ttc } from "#src/app/i18n/ttc.ts"
import { socialLoginProvider } from "#src/auth/model_field/socialLoginProvider.ts"
import { classesAuthCard } from "#src/auth/ui/shared/classesAuthCard.ts"
import { AuthSplitLayout } from "#src/auth/ui/shared/AuthSplitLayout.tsx"
import { SignInWithAnExistingSession } from "#src/auth/ui/sign_in/existing/SignInWithAnExistingSession.tsx"
import { socialProviderButtonProps } from "#src/auth/ui/sign_in/social/SocialProviderButtonProps.ts"
import { SignUpEmailPasswordForm } from "#src/auth/ui/sign_up/form/SignUpEmailPasswordForm.tsx"
import { signUpDemoStateCreate } from "#src/auth/ui/sign_up/form/signUpDemoStateCreate.ts"
import { SignInButtonLink } from "#src/auth/ui/sign_up/SignInButtonLink.tsx"
import { signUpPageContentStateCreate } from "#src/auth/ui/sign_up/signUpPageContentStateCreate.ts"
import { urlAuthProvider } from "#src/auth/url/urlAuthProvider.ts"
import { urlSignInRedirectUrl } from "#src/auth/url/urlSignInRedirectUrl.ts"
import { searchParamGet } from "#src/utils/router/searchParamGet.ts"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonExternal, LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { Icon } from "#ui/static/icon/Icon.jsx"
import { Img } from "#ui/static/img/Img.jsx"
import { LayoutWrapperDemo } from "#ui/static/layout/LayoutWrapperDemo.jsx"
import { Separator } from "#ui/static/separator/Separator.jsx"
import { classArr } from "#ui/utils/classArr.ts"
import { cn } from "cn"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"
import type { MayHaveInnerClass } from "#ui/utils/MayHaveInnerClass.ts"
import { capitalizeFirstLetter } from "#utils/text/capitalizeFirstLetter.js"
import { authLegalAgreeVariant } from "#src/auth/ui/sign_in/legal/authLegalAgreeVariant.tsx"

interface SignUpPageProps extends MayHaveClass, MayHaveInnerClass {}

export const SignUpPage: Component<SignUpPageProps> = () => {
  return (
    <LayoutWrapperDemo title={ttc("Sign up")}>
      <SignUpPageContent />
    </LayoutWrapperDemo>
  )
}

export function SignUpPageContent(p: { demo?: boolean; signInHref?: string; confirmHref?: string; message?: string }) {
  const state = signUpPageContentStateCreate(() => p)
  return (
    <AuthSplitLayout legalVariant={authLegalAgreeVariant.signUp}>
      <h1 class="text-base font-semibold lg:text-lg">{ttc("Sign up")}</h1>
      <Show when={!p.demo}>
        <SignInWithAnExistingSession h2Class="text-sm font-semibold" innerClass="flex flex-col gap-2" />
      </Show>
      <section class={classesAuthCard}>
        <div class="mb-3 flex items-center gap-3">
          <span class="grid size-9 shrink-0 place-items-center rounded-md bg-hover">
            <Icon path={mdiAccountPlus} class="size-5" />
          </span>
          <div class="min-w-0">
            <h2 class="text-sm font-semibold">{ttc("Create new account")}</h2>
            <p class="text-xs text-muted-foreground">{ttc("Join us and start your journey")}</p>
          </div>
        </div>
        <div class="flex flex-col gap-3">
          <SignUpEmailPasswordForm stateFactory={p.demo ? signUpDemoStateCreate : undefined} />
          <Show
            when={!p.demo}
            fallback={
              <section class="flex flex-col gap-2">
                <h2 class="text-sm font-semibold">Demo only</h2>
                <p class="text-sm text-muted-foreground">No account is created or email sent.</p>
                <p role="status" class="text-sm">
                  {p.message}
                </p>
                <Show when={state.confirmHref()}>
                  {(href) => <LinkButtonInternal to={href()}>Continue to confirmation demo</LinkButtonInternal>}
                </Show>
                <LinkButtonInternal to={p.signInHref ?? "#"}>Sign in demo</LinkButtonInternal>
              </section>
            }
          >
            <Separator />
            <SignUpSocialSection />
            <Separator />
            <HaveAnAccountSection />
          </Show>
        </div>
      </section>
    </AuthSplitLayout>
  )
}

function SignUpPageContent2() {
  return (
    <div class={cn("container max-w-7xl mx-auto py-8 px-4")}>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <LeftSide />
        <RightSide />
      </div>
    </div>
  )
}

function LeftSide() {
  return <SignInWithAnExistingSession class="flex flex-col gap-2" />
}

export function AuthCoverIllustration(p: MayHaveClass) {
  const url = "/img/illustrations/auth/sign_in_1.svg"
  return <Img src={url} alt="Sign up illustration" class={cn("hidden lg:flex w-full max-w-3xl", p.class)} />
}

function RightSide() {
  return (
    <div class="space-y-8">
      <SignUpEmailPasswordSection />
      <Separator />
      <SignUpSocialSection />
      <Separator />
      <HaveAnAccountSection />
    </div>
  )
}

function SignUpEmailPasswordSection(p: { demo?: boolean } = {}) {
  return (
    <section class={classArr(classesAuthCard, "max-w-2xl")}>
      <div class="mb-3 flex items-center gap-3">
        <span class="grid size-9 shrink-0 place-items-center rounded-md bg-hover">
          <Icon path={mdiAccountPlus} class="size-5" />
        </span>
        <div class="min-w-0">
          <h2 class="text-sm font-semibold">{ttc("Create new account")}</h2>
          <p class="text-xs text-muted-foreground">{ttc("Join us and start your journey")}</p>
        </div>
      </div>
      <SignUpEmailPasswordForm stateFactory={p.demo ? signUpDemoStateCreate : undefined} />
    </section>
  )
}

function SignUpSocialSection() {
  const buttonClasses = "w-full"
  return (
    <section class="flex flex-col gap-2">
      <h2 class="text-sm font-semibold">{ttc("Sign Up With")}</h2>
      <SocialSignUpButton provider={socialLoginProvider.google} class={buttonClasses} />
      {enableGithub() && <SocialSignUpButton provider={socialLoginProvider.github} class={buttonClasses} />}
    </section>
  )
}

interface SocialSignUpButtonProps {
  provider: (typeof socialLoginProvider)[keyof typeof socialLoginProvider]
  class?: string
}

function SocialSignUpButton(p: SocialSignUpButtonProps) {
  const props = socialProviderButtonProps[p.provider]
  const text = "Sign up with " + capitalizeFirstLetter(p.provider)
  function getReturnPath() {
    const returnPath = searchParamGet("returnPath") || urlSignInRedirectUrl()
    return urlAuthProvider(p.provider, returnPath)
  }
  return (
    <LinkButtonExternal href={getReturnPath()} icon={props.mdiIconPath} variant={buttonVariant.outline} class={p.class}>
      {text}
    </LinkButtonExternal>
  )
}

function HaveAnAccountSection() {
  return (
    <section class="flex flex-col gap-2">
      <h2 class="text-sm font-semibold">{ttc("Have an account?")}</h2>
      <SignInButtonLink text={ttc("Sign In instead")} class="w-full" />
    </section>
  )
}
