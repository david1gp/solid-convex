import { mdiArrowULeftTop } from "@adaptive-ds/mdi/mdiArrowULeftTop.js"
import { mdiEmail } from "@adaptive-ds/mdi/mdiEmail.js"
import { Show } from "solid-js"
import { DevModeToggle } from "#src/app/config/DevModeToggle.tsx"
import { inDevModeSignal } from "#src/app/config/inDevModeSignal.ts"
import { ttc } from "#src/app/i18n/ttc.ts"
import { LogoutButton } from "#src/app/nav/LogoutButton.tsx"
import { NavAuth } from "#src/app/nav/NavAuth.tsx"
import { urlSupportMailTo, urlSupportTelegram } from "#src/app/url/urlSupport.ts"
import { DeleteEarlierSessions } from "#src/auth/ui/sign_in/existing/DeleteEarlierSessions.tsx"
import { userSessionGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonExternal } from "#ui/interactive/link/LinkButton.jsx"
import { iconTelegram } from "#ui/static/icons/iconTelegram.ts"
import { LayoutWrapperDemo } from "#ui/static/layout/LayoutWrapperDemo.jsx"
import { SuccessPage } from "#ui/static/pages/SuccessPage.jsx"

export function AccessBlocked() {
  const signedInEmail = () => userSessionGet()?.profile.email

  return (
    <LayoutWrapperDemo title={ttc("Access Blocked")}>
      <NavAuth title={ttc("Access Blocked")} />
      <SuccessPage title={ttc("Thank you for signing up!")}>
        <p class="text-lg font-medium my-6">{ttc("Access is by invitation only.")}</p>

        <div class="space-y-4 mb-6">
          <div>
            <p class="font-medium mb-1">{ttc("Already received an invitation email?")}</p>
            <p class="text-muted-foreground text-sm">
              {ttc("Make sure it was sent to the email you signed up with → open the link and accept the invite.")}
            </p>
          </div>

          <div>
            <p class="font-medium mb-2">{ttc("No invitation yet?")}</p>
            <p class="text-muted-foreground text-sm mb-2">
              {ttc("Send us a quick message via email or Telegram (buttons below) with:")}
            </p>
            <ul class="list-disc list-inside text-muted-foreground text-sm space-y-1 ml-2">
              <li>{ttc("Your name")}</li>
              <li>{ttc("Your email")}</li>
              <li>{ttc("Your organization")}</li>
            </ul>
            <p class="text-muted-foreground text-sm mt-2">
              {ttc("We'll review and send an invitation to your registered email. Thank you for your patience!")}
            </p>
          </div>
        </div>

        <p class="font-medium mb-2">{ttc("Contact us:")}</p>
        <div class="flex flex-col gap-2 mb-4">
          <LinkButtonExternal
            href={urlSupportMailTo}
            icon={mdiEmail}
            variant={buttonVariant.link}
            class="justify-start"
          >
            {ttc("E-Mail")}
          </LinkButtonExternal>
          <LinkButtonExternal
            href={urlSupportTelegram}
            icon={iconTelegram}
            variant={buttonVariant.link}
            class="justify-start"
          >
            {ttc("Telegram")}
          </LinkButtonExternal>
        </div>

        <DevModeToggle class="mt-2" />
        <Show when={inDevModeSignal.get()}>
          <LogoutButton text={ttc("Logout from Session")} />
          <DeleteEarlierSessions icon={mdiArrowULeftTop} variant={buttonVariant.link}>
            {ttc("Reset Sessions")}
          </DeleteEarlierSessions>
        </Show>
      </SuccessPage>

      <Show when={signedInEmail()}>
        <div class="max-w-md mx-auto mt-4 mb-4">
          <p class="font-medium mb-3">{ttc("Signed in with a wrong account?")}</p>
          <LogoutButton text={ttc("Sign out from") + " " + signedInEmail()} />
        </div>
      </Show>
    </LayoutWrapperDemo>
  )
}
