import { ttc } from "#src/app/i18n/ttc.ts"
import { NavLinkButton } from "#src/app/nav/links/NavLinkButton.tsx"
import { urlUserProfileMe } from "#src/auth/url/pageRouteAuth.ts"
import { Button } from "#ui/interactive/button/Button.tsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { userProfileMeDeletePageStateCreate } from "./userProfileMeDeletePageStateCreate.ts"

export function UserProfileMeDeleteView(p: {
  stateFactory?: typeof userProfileMeDeletePageStateCreate
  profileHref?: string
}) {
  const state = (p.stateFactory ?? userProfileMeDeletePageStateCreate)()
  return (
    <div class="max-w-xl mx-auto">
      <h1 class="text-3xl font-bold mb-4">{ttc("Delete Account")}</h1>
      <div class="rounded-md border border-border bg-background p-4 sm:p-5 space-y-6">
        <p class="text-sm text-muted-foreground">
          {ttc("Are you sure you want to delete your account? This action cannot be undone.")}
        </p>
        <Button
          type="button"
          variant={buttonVariant.filledRed}
          onClick={state.remove}
          disabled={state.deleting() || state.deleted()}
          class="w-full"
        >
          {state.deleting() ? ttc("Deleting...") : ttc("Delete My Account")}
        </Button>
        <p role="status">{state.message()}</p>
        <div class="text-center">
          <NavLinkButton href={p.profileHref ?? urlUserProfileMe()} isActive={false}>
            {ttc("Cancel")}
          </NavLinkButton>
        </div>
      </div>
    </div>
  )
}
