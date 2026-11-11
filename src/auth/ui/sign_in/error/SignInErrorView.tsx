import { mdiAlertBoxOutline } from "@adaptive-ds/mdi/mdiAlertBoxOutline.js"
import { Show } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { ContactSupportLinkButton } from "#src/ui/links/ContactSupportLinkButton.tsx"
import { GoSignInLinkButton } from "#src/ui/links/GoSignInLinkButton.tsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { Icon } from "#ui/static/icon/Icon.jsx"
import { classesPageWrapper } from "#ui/static/page/classesPageWrapper.ts"
import { classArr } from "#ui/utils/classArr.ts"

const classesPageWrapperInner = classArr("max-w-md w-full", "bg-white dark:bg-gray-800", "rounded-lg shadow-md", "p-8")

export function SignInErrorView(p: { errorMessage: string | null; signInHref?: string }) {
  return (
    <div class={classArr(classesPageWrapper)}>
      <section id="authenticationError" class="flex flex-col gap-2">
        <Icon path={mdiAlertBoxOutline} class={classArr("size-16 mx-auto", "fill-red-500")} />
        <h1 class="text-2xl font-bold">{ttc("Authentication Error")}</h1>
      </section>
      <section id="errorMessage" class={classArr("flex flex-col gap-2 py-12")}>
        <h2 class="text-lg text-foreground-muted">Error Message:</h2>
        <code class={classArr("text-xl", classesPageWrapperInner)}>{p.errorMessage}</code>
      </section>
      <section id="tryAgain" class="container max-w-7xl mx-auto text-center space-y-8">
        <h2>{ttc("Please try again, if the problem persists contact support")}</h2>
        <Show
          when={p.signInHref}
          fallback={
            <GoSignInLinkButton variant={buttonVariant.link} />
          }
        >
          {(href) => (
            <LinkButtonInternal to={href()} variant={buttonVariant.link}>
              Go to Sign-In demo
            </LinkButtonInternal>
          )}
        </Show>
        <Show when={!p.signInHref}>
          <ContactSupportLinkButton variant={buttonVariant.link} />
        </Show>
      </section>
    </div>
  )
}
