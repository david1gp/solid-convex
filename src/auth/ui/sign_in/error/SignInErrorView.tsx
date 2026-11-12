import { mdiAlertBoxOutline } from "@adaptive-ds/mdi/mdiAlertBoxOutline.js"
import { Show } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { classesAuthCard } from "#src/auth/ui/shared/classesAuthCard.ts"
import { AuthSplitLayout } from "#src/auth/ui/shared/AuthSplitLayout.tsx"
import { ContactSupportLinkButton } from "#src/ui/links/ContactSupportLinkButton.tsx"
import { GoSignInLinkButton } from "#src/ui/links/GoSignInLinkButton.tsx"
import { buttonSize, buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { Icon } from "#ui/static/icon/Icon.jsx"

export function SignInErrorView(p: { errorMessage: string | null; signInHref?: string }) {
  return (
    <AuthSplitLayout>
      <section id="authenticationError" class={classesAuthCard}>
        <div class="mb-3 flex items-center gap-3">
          <span class="grid size-9 shrink-0 place-items-center rounded-md bg-hover">
            <Icon path={mdiAlertBoxOutline} class="size-5 text-danger" />
          </span>
          <h1 class="text-base font-semibold lg:text-lg">{ttc("Authentication Error")}</h1>
        </div>
        <div id="errorMessage" class="flex flex-col gap-2">
          <h2 class="text-sm text-muted-foreground">Error Message:</h2>
          <code class="rounded-md border border-danger bg-danger-soft p-4 text-sm">{p.errorMessage}</code>
        </div>
        <section id="tryAgain" class="mt-3 flex flex-col items-center gap-2 text-center">
          <h2 class="text-sm text-muted-foreground">
            {ttc("Please try again, if the problem persists contact support")}
          </h2>
          <Show
            when={p.signInHref}
            fallback={
              <GoSignInLinkButton
                size={buttonSize.lg}
                variant={buttonVariant.link}
                class="text-xl"
                iconClass="size-8"
              />
            }
          >
            {(href) => (
              <LinkButtonInternal to={href()} size={buttonSize.lg} variant={buttonVariant.link}>
                Go to Sign-In demo
              </LinkButtonInternal>
            )}
          </Show>
          <Show when={!p.signInHref}>
            <ContactSupportLinkButton
              size={buttonSize.lg}
              variant={buttonVariant.link}
              class="text-xl"
              iconClass="size-8"
            />
          </Show>
        </section>
      </section>
    </AuthSplitLayout>
  )
}
