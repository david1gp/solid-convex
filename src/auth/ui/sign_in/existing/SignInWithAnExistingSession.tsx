import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime.js"
import { For, Show } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import type { UserSession } from "#src/auth/model/UserSession.ts"
import { DeleteEarlierSessions } from "#src/auth/ui/sign_in/existing/DeleteEarlierSessions.tsx"
import { signInSessionExisting } from "#src/auth/ui/sign_in/logic/signInSessionExisting.ts"
import { userSessionsSignal } from "#src/auth/ui/signals/userSessionsSignal.ts"
import { urlSignInRedirectUrl } from "#src/auth/url/urlSignInRedirectUrl.ts"
import { navigateTo } from "#src/utils/router/navigateTo.ts"
import { Button } from "#ui/interactive/button/Button.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { classesCardWrapper } from "#ui/static/card/classesCardWrapper.ts"
import { classArr } from "#ui/utils/classArr.ts"
import { cn } from "cn"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"
import type { MayHaveInnerClass } from "#ui/utils/MayHaveInnerClass.ts"
import { type JSX } from "@solidjs/web";

dayjs.extend(relativeTime)

export interface SignInWithAnExistingSessionProps extends MayHaveInnerClass, MayHaveClass {
  h2Class?: string
  fallback?: JSX.Element
}

export function SignInWithAnExistingSession(p: SignInWithAnExistingSessionProps) {
  const sessions = userSessionsSignal.get
  return (
    <Show when={sessions().length > 0} fallback={p.fallback}>
      <section
        class={cn(
          // "space-y-4 max-w-2xl",
          // sessions().length > 4 ? "row-span-3" : sessions().length > 2 ? "row-span-2" : "",
          p.class,
        )}
      >
        <h2 class={cn("text-xl font-semibold", p.h2Class)}>{ttc("Continue with an earlier session")}</h2>
        <div class={p.innerClass ?? "contents"}>
          <For each={sessions()}>{(session: UserSession) => <SessionButton session={session} />}</For>
          <DeleteEarlierSessions />
        </div>
      </section>
    </Show>
  )
}

export interface SessionButtonProps extends MayHaveClass {
  session: UserSession
}

function SessionButton(p: SessionButtonProps) {
  return (
    <Button
      variant={buttonVariant.outline}
      class={classArr(
        //
        "flex items-center p-4",
        classesCardWrapper,
      )}
      onClick={() => sessionOnClick(p.session)}
    >
      <div class="flex items-center gap-3 w-full">
        <SessionImage user={p.session.profile} />
        <div class="text-left">
          <div class="text-lg">{p.session.profile.name}</div>
          {p.session.profile.email && <div class="text-muted-foreground">{p.session.profile.email}</div>}
          <div class="text-muted-foreground">signed in: {dayjs(p.session.signedInAt).fromNow()}</div>
        </div>
      </div>
    </Button>
  )
}

function sessionOnClick(session: UserSession) {
  signInSessionExisting(session)
  const url = urlSignInRedirectUrl()
  navigateTo(url)
}

function SessionImage(p: { user: UserSession["profile"] }) {
  return (
    <Show when={p.user.image} fallback={<SessionImageFallback name={p.user.name} />}>
      <img src={p.user.image!} alt={p.user.name} class="w-10 h-10 rounded-full object-cover" />
    </Show>
  )
}

function SessionImageFallback(p: { name: string }) {
  return (
    <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
      <span class="">{p.name.charAt(0).toUpperCase()}</span>
    </div>
  )
}
