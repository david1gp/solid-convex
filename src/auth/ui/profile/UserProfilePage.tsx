import { Match, Switch } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { NavLinkButton } from "#src/app/nav/links/NavLinkButton.tsx"
import { NavBreadcrumbSeparator } from "#src/app/nav/NavBreadcrumbSeparator.tsx"
import { NavCrumbs } from "#src/app/nav/NavCrumbs.tsx"
import { urlUserProfileView } from "#src/auth/url/pageRouteAuth.ts"
import { ErrorPage } from "#src/ui/pages/ErrorPage.tsx"
import { PageWrapper } from "#ui/static/page/PageWrapper.tsx"
import { UserProfileView } from "./UserProfileView.tsx"
import { userProfileLoaderStateCreate } from "./userProfileLoaderStateCreate.ts"
import { userProfilePageStateCreate } from "./userProfilePageStateCreate.ts"

export function UserProfilePage() {
  const state = userProfilePageStateCreate()
  return (
    <Switch>
      <Match when={!state.username()}>
        <ErrorPage title={ttc("Missing :username in path")} />
      </Match>
      <Match when={state.username()}>
        <PageWrapper>
          <NavCrumbs>
            <NavBreadcrumbSeparator />
            <NavLinkButton href={urlUserProfileView(state.username()!)} isActive={true}>
              {ttc("User Profile")}
            </NavLinkButton>
          </NavCrumbs>
          <UserProfileLoader username={state.username()!} />
        </PageWrapper>
      </Match>
    </Switch>
  )
}

function UserProfileLoader(p: { username: string }) {
  const state = userProfileLoaderStateCreate(() => p.username)
  return (
    <Switch>
      <Match when={state.loading()}>
        <ErrorPage title={ttc("Error loading user profile")} />
      </Match>
      <Match when={state.missing()}>
        <ErrorPage title={ttc("User not found")} />
      </Match>
      <Match when={state.error()}>
        <ErrorPage title={state.error()} />
      </Match>
      <Match when={state.profile()}>{(profile) => <UserProfileView profile={profile()} />}</Match>
    </Switch>
  )
}
