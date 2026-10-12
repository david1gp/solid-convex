import { Match, Switch } from "solid-js"
import { AppShell } from "#src/app/layout/AppShell.tsx"
import { LayoutWrapperConvex } from "#src/app/layout/LayoutWrapperConvex.tsx"
import { SignInPageLoader } from "#src/auth/ui/sign_in/page/SignInPageLoader.tsx"
import { userSessionSignal } from "#src/auth/ui/signals/userSessionSignal.ts"
import { userSessionsSignalRegisterHandler } from "#src/auth/ui/signals/userSessionsSignal.ts"
import type { MayHaveChildren } from "#ui/utils/MayHaveChildren.ts"
import type { MayHaveTitle } from "#ui/utils/MayHaveTitle.ts"

export interface LayoutWrapperAuthProps extends MayHaveChildren, MayHaveTitle {}

export function LayoutWrapperAuth(p: LayoutWrapperAuthProps) {
  userSessionsSignalRegisterHandler()

  return (
    <Switch>
      <Match when={!userSessionSignal.get()}>
        <SignInPageLoader />
      </Match>
      <Match when={true}>
        <LayoutWrapperConvex title={p.title}>
          <AppShell>{p.children}</AppShell>
        </LayoutWrapperConvex>
      </Match>
    </Switch>
  )
}
