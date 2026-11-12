import { Show } from "solid-js"
import { oidcSignInLabel } from "#src/app/config/oidcSignInLabel.ts"
import { classesAuthCard } from "#src/auth/ui/shared/classesAuthCard.ts"
import { AuthSplitLayout } from "#src/auth/ui/shared/AuthSplitLayout.tsx"
import { allgroupsSsoPageStateCreate } from "#src/sso/model/allgroupsSsoPageStateCreate.ts"
import { Checkbox } from "#ui/input/check/Checkbox.tsx"
import { Button } from "#ui/interactive/button/Button.tsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"

export function AllgroupsSsoPage(p: { stateFactory?: typeof allgroupsSsoPageStateCreate }) {
  const state = (p.stateFactory ?? allgroupsSsoPageStateCreate)()

  return (
    <AuthSplitLayout>
      <main class={classesAuthCard}>
        <span class="mx-auto grid size-9 place-items-center rounded-md bg-primary text-sm font-bold text-white">A</span>
        <p class="mt-3 text-center text-xs font-semibold uppercase tracking-widest text-primary">Allgroups Chat</p>
        <h1 class="mt-2 text-center text-base font-semibold lg:text-lg">Single Sign-On</h1>
        <p class="mt-2 text-center text-sm text-muted-foreground">
          Sign in with your organization account. Existing identity-provider sessions are detected automatically.
        </p>
        <Show when={state.errorMessage()}>
          {(message) => (
            <div role="alert" class="mt-3 rounded-md border border-danger bg-danger-soft p-4 text-left text-sm">
              <p class="font-semibold">Sign-in could not be completed.</p>
              <p class="mt-1">{message()}</p>
            </div>
          )}
        </Show>
        <div class="mt-3 flex flex-col gap-3">
          <Button
            variant={buttonVariant.filledIndigo}
            class="w-full"
            onClick={state.loginClick}
            disabled={state.isPending()}
          >
            {oidcSignInLabel()}
          </Button>
        </div>
        <div class="mt-3 flex items-center justify-center">
          <Checkbox id="sso-auto-sign-in" checked={state.autoSignIn()} onChange={state.autoSignInToggle}>
            <span class="text-sm font-medium">Sign in automatically</span>
          </Checkbox>
        </div>
        <p class="mt-3 text-center text-xs text-muted-foreground">Secure OpenID Connect · no local password</p>
      </main>
    </AuthSplitLayout>
  )
}
