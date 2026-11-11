import { mdiAccountPlus } from "@adaptive-ds/mdi/mdiAccountPlus.js"
import { type Component, Show } from "solid-js"
import { enableGithub } from "#src/app/config/enableGithub.ts"
import { ttc } from "#src/app/i18n/ttc.ts"
import { NavAuth } from "#src/app/nav/NavAuth.tsx"
import { socialLoginProvider } from "#src/auth/model_field/socialLoginProvider.ts"
import { AuthSectionCard } from "#src/auth/ui/shared/AuthSectionCard.tsx"
import { SignInWithAnExistingSession } from "#src/auth/ui/sign_in/existing/SignInWithAnExistingSession.tsx"
import { socialProviderButtonProps } from "#src/auth/ui/sign_in/social/SocialProviderButtonProps.ts"
import { SignUpEmailPasswordForm } from "#src/auth/ui/sign_up/form/SignUpEmailPasswordForm.tsx"
import { signUpDemoStateCreate } from "#src/auth/ui/sign_up/form/signUpDemoStateCreate.ts"
import { SignInButtonLink } from "#src/auth/ui/sign_up/SignInButtonLink.tsx"
import { signUpPageContentStateCreate } from "#src/auth/ui/sign_up/signUpPageContentStateCreate.ts"
import { urlAuthProvider } from "#src/auth/url/urlAuthProvider.ts"
import { urlSignInRedirectUrl } from "#src/auth/url/urlSignInRedirectUrl.ts"
import { searchParamGet } from "#src/utils/router/searchParamGet.ts"
import { classesBgGray } from "#ui/classes/classesBg.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonExternal, LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { linkIcons } from "#ui/static/icon/linkIcons.ts"
import { Img } from "#ui/static/img/Img.jsx"
import { LayoutWrapperDemo } from "#ui/static/layout/LayoutWrapperDemo.jsx"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"
import { Separator } from "#ui/static/separator/Separator.jsx"
import { classArr } from "#ui/utils/classArr.ts"
import { classMerge } from "#ui/utils/classMerge.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"
import type { MayHaveInnerClass } from "#ui/utils/MayHaveInnerClass.ts"
import { capitalizeFirstLetter } from "#utils/text/capitalizeFirstLetter.js"

interface SignUpPageProps extends MayHaveClass, MayHaveInnerClass {}

export const SignUpPage: Component<SignUpPageProps> = (p) => {
  return (
    <LayoutWrapperDemo title={ttc("Sign up")}>
      <div class={classMerge("min-h-dvh w-full", classesBgGray, p.class)}>
        <NavAuth title={ttc("Sign up")}>
          <SignInButtonLink
            variant={buttonVariant.link}
            icon={linkIcons.enter}
            iconRight=""
          />
        </NavAuth>
        <SignUpPageContent />
      </div>
    </LayoutWrapperDemo>
  )
}

export function SignUpPageContent(p: { demo?: boolean; signInHref?: string; confirmHref?: string; message?: string }) {
  const state = signUpPageContentStateCreate(() => p)
  return (
    <PageWrapper
      innerClass={classArr(
        // "max-w-7xl",
        // "max-w-4xl",
        state.sessionsCount() === 0 && "max-w-4xl",
        // "flex flex-col gap-8",
        "grid grid-cols-1",
        state.sessionsCount() > 0 ? "lg:grid-cols-3" : "lg:grid-cols-2",
        "gap-8",
      )}
    >
      <Show when={!p.demo}>
        <SignInWithAnExistingSession h2Class="mb-2" innerClass="grid gap-4" />
      </Show>
      <SignUpEmailPasswordSection demo={p.demo} />
      <div class="flex flex-col gap-8">
        <Show
          when={!p.demo}
          fallback={
            <section class="space-y-3">
              <h2 class="text-xl font-semibold">Demo only</h2>
              <p>No account is created or email sent.</p>
              <p role="status">{p.message}</p>
              <Show when={state.confirmHref()}>
                {(href) => <LinkButtonInternal to={href()}>Continue to confirmation demo</LinkButtonInternal>}
              </Show>
              <LinkButtonInternal to={p.signInHref ?? "#"}>Sign in demo</LinkButtonInternal>
            </section>
          }
        >
          <SignUpSocialSection />
          <HaveAnAccountSection />
        </Show>
      </div>
    </PageWrapper>
  )
}

function SignUpPageContent2() {
  return (
    <div class={classMerge("container max-w-7xl mx-auto py-8 px-4")}>
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
  return <Img src={url} alt="Sign up illustration" class={classMerge("hidden lg:flex w-full max-w-3xl", p.class)} />
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
    <AuthSectionCard
      icon={mdiAccountPlus}
      title={ttc("Create new account")}
      subtitle={ttc("Join us and start your journey")}
      class="space-y-4 max-w-2xl"
    >
      <SignUpEmailPasswordForm stateFactory={p.demo ? signUpDemoStateCreate : undefined} />
    </AuthSectionCard>
  )
}

function SignUpSocialSection() {
  const buttonClasses = "w-full"
  return (
    <section class="flex flex-col gap-2">
      <h2 class="text-xl font-semibold">{ttc("Sign Up With")}</h2>
      <SocialSignUpButton provider={socialLoginProvider.google} class={buttonClasses} />
      {enableGithub() && (
        <SocialSignUpButton provider={socialLoginProvider.github} class={buttonClasses} />
      )}
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
    <LinkButtonExternal
      href={getReturnPath()}
      icon={props.mdiIconPath}
      iconClass="fill-white"
      style={{ background: props.background }}
      variant={buttonVariant.filledIndigo}
      class={p.class}
    >
      {text}
    </LinkButtonExternal>
  )
}

function HaveAnAccountSection() {
  return (
    <section class="space-y-2">
      <h2 class="text-xl font-semibold">{ttc("Have an account?")}</h2>
      <SignInButtonLink text={ttc("Sign In instead")} class="w-full" />
    </section>
  )
}
